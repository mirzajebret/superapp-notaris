"""
Notarial Deed PDF FORMATTER (Akta Notaris) - v25
Final version with dynamic output filenames based on --type flag (_SALINAN.pdf / _MINUTA.pdf).
"""

import os
import sys
import fitz  # PyMuPDF library
from reportlab.pdfgen import canvas
from io import BytesIO


class NotarialDeedFormatter:
    def __init__(self, input_pdf, output_pdf, deed_type="salinan"):
        self.input_pdf = input_pdf
        self.output_pdf = output_pdf
        self.deed_type = deed_type # "salinan" atau "minuta"
        # --- Customization Parameters ---
        self.line_offset = 8
        self.indent_tolerance = 5
        self.line_gap_tolerance = 25
        # --- Filtering Parameters ---
        self.footer_zone_start = 0.97
        self.center_tolerance = 0.15
        self.max_title_words = 6
        # --- Decorative Line Parameters ---
        self.diagonal_line_length = 30
        self.diagonal_line_height = 20
        
    def add_red_lines_to_pdf(self):
        """
        Adds a continuous line to the left of each paragraph, following indentations.
        """
        try:
            print("Reading PDF with PyMuPDF...")
            doc = fitz.open(self.input_pdf)
            
            print(f"Total pages: {len(doc)}")
            
            for page_num, page in enumerate(doc):
                print(f"Processing page {page_num + 1}...")
                
                page_rect = page.rect
                page_center_x = page_rect.width / 2
                
                blocks = page.get_text("blocks")
                content_blocks = []
                found_main_body = False

                for b in blocks:
                    if b[1] > page_rect.height * self.footer_zone_start:
                        continue
                    
                    if page_num == 0 and not found_main_body:
                        block_center_x = (b[0] + b[2]) / 2
                        is_centered = abs(block_center_x - page_center_x) < page_rect.width * self.center_tolerance
                        word_count = len(b[4].split())
                        is_title = is_centered and word_count < self.max_title_words

                        if is_title:
                            continue
                        else:
                            found_main_body = True 
                            content_blocks.append(b)
                    else:
                        content_blocks.append(b)

                if not content_blocks:
                    print(f"  - No content to line on page {page_num + 1}. Skipping.")
                    continue
                
                content_blocks.sort(key=lambda b: b[1])

                # Logika dinamis untuk halaman terakhir berdasarkan tipe akta
                if page_num == len(doc) - 1 and len(content_blocks) > 1:
                    stop_keyword = ""
                    if self.deed_type == "minuta":
                        stop_keyword = "- Minuta akta ini telah ditandatangani"
                    else: # Default untuk Salinan
                        stop_keyword = "- Diberikan sebagai SALINAN"

                    last_content_index = -1
                    for i in range(len(content_blocks)):
                        if content_blocks[i][4].strip().startswith(stop_keyword):
                            last_content_index = i # Temukan indeks baris terakhir yang diinginkan
                            break

                    if last_content_index != -1:
                        print(f"  - Last page detected. Truncating content after '{stop_keyword}...'.")
                        # Potong daftar untuk HANYA menyertakan baris terakhir yang ditemukan
                        content_blocks = content_blocks[:last_content_index + 1]

                # Group blocks into continuous line segments
                if not content_blocks:
                    continue
                
                line_segments = []
                current_segment = {"x": content_blocks[0][0], "y0": content_blocks[0][1], "y1": content_blocks[0][3]}

                for i in range(1, len(content_blocks)):
                    prev_block, current_block = content_blocks[i-1], content_blocks[i]
                    is_same_indent = abs(current_block[0] - current_segment["x"]) < self.indent_tolerance
                    is_vertically_close = (current_block[1] - prev_block[3]) < self.line_gap_tolerance

                    if is_same_indent and is_vertically_close:
                        current_segment["y1"] = current_block[3]
                    else:
                        line_segments.append(current_segment)
                        current_segment = {"x": current_block[0], "y0": current_block[1], "y1": current_block[3]}
                line_segments.append(current_segment)

                # Draw the segments
                overlay_buffer = BytesIO()
                c = canvas.Canvas(overlay_buffer, pagesize=(page_rect.width, page_rect.height))
                
                # Atur warna berdasarkan tipe akta
                if self.deed_type == "minuta":
                    c.setStrokeColorRGB(0, 0, 0) # Hitam
                else:
                    c.setStrokeColorRGB(1, 0, 0) # Merah

                c.setLineWidth(0.5)
                
                if not line_segments:
                    continue

                for segment in line_segments:
                    line_x = segment["x"] - self.line_offset
                    y_start_rl = page_rect.height - segment["y0"]
                    y_end_rl = page_rect.height - segment["y1"]
                    if line_x > 5:
                        c.line(line_x, y_start_rl, line_x, y_end_rl)

                first, last = line_segments[0], line_segments[-1]
                self._draw_top_diagonal(c, first["x"] - self.line_offset, page_rect.height - first["y0"])
                self._draw_bottom_diagonal(c, last["x"] - self.line_offset, page_rect.height - last["y1"])
                
                c.save()
                overlay_buffer.seek(0)
                
                overlay_pdf = fitz.open("pdf", overlay_buffer.read())
                page.show_pdf_page(page.rect, overlay_pdf, 0)
            
            print("Writing output PDF...")
            doc.save(self.output_pdf, garbage=4, deflate=True, clean=True)
            doc.close()
            
            print(f"PDF formatted successfully: {self.output_pdf}")
            return True
            
        except Exception as e:
            print(f"Error processing PDF: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _draw_top_diagonal(self, c, x, y):
        c.setLineWidth(0.5)
        offset, v_shift = 4, 8
        y_shifted = y - v_shift
        x_start, x_end = x - (self.diagonal_line_length / 2), x + (self.diagonal_line_length / 2)
        y_top, y_bottom = y_shifted + (offset / 2), y_shifted - (offset / 2)
        c.line(x_start, y_top, x_end, y_top + self.diagonal_line_height)
        c.line(x_start, y_bottom, x_end, y_bottom + self.diagonal_line_height)

    def _draw_bottom_diagonal(self, c, x, y):
        c.setLineWidth(0.5)
        offset, v_shift = 4, 8
        y_shifted = y + v_shift
        x_start, x_end = x - (self.diagonal_line_length / 2), x + (self.diagonal_line_length / 2)
        y_top, y_bottom = y_shifted + (offset / 2), y_shifted - (offset / 2)
        c.line(x_start, y_top, x_end, y_top - self.diagonal_line_height)
        c.line(x_start, y_bottom, x_end, y_bottom - self.diagonal_line_height)

def main():
    print("=" * 60)
    print("TOOL GARIS AKTA NOTARIS (MINUTA & SALINAN)")
    print("Versi 25")
    print("2025 assidiqiemirza@gmail.com")
    print("=" * 60)
    
    args = sys.argv[1:]
    if len(args) < 1:
        print("Usage: python index.py <input_pdf> [output_pdf] [--type <salinan|minuta>]")
        return
    
    input_pdf = args[0]
    deed_type = "salinan" # Default

    # Parsing argumen untuk --type
    if "--type" in args:
        try:
            type_index = args.index("--type")
            deed_type = args[type_index + 1].lower()
            if deed_type not in ["salinan", "minuta"]:
                print(f"Error: Tipe tidak valid '{deed_type}'. Gunakan 'salinan' atau 'minuta'.")
                return
        except IndexError:
            print("Error: Flag --type membutuhkan nilai ('salinan' atau 'minuta').")
            return

    # Menentukan nama file output
    output_pdf = ""
    # Cek jika output file ditentukan secara manual (bukan flag)
    if len(args) > 1 and not args[1].startswith('--'):
        output_pdf = args[1]
    else:
        # Buat nama file default berdasarkan tipe akta
        suffix = f"_{deed_type.upper()}.pdf"
        # Gunakan rsplit untuk menghindari masalah dengan titik di nama folder
        output_pdf = input_pdf.rsplit('.', 1)[0] + suffix

    if not os.path.exists(input_pdf):
        print(f"Error: File '{input_pdf}' tidak ditemukan")
        return
    
    formatter = NotarialDeedFormatter(input_pdf, output_pdf, deed_type=deed_type)
    if formatter.add_red_lines_to_pdf():
        print("\n" + "=" * 60)
        print(f"SELESAI! PDF Anda ({deed_type.upper()}) telah siap.")
        print(f"   -> {output_pdf}")
        print("=" * 60)
    else:
        print("\nGagal memformat PDF.")


if __name__ == "__main__":
    main()