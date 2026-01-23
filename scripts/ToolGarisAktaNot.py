"""
Notarial Deed PDF FORMATTER (Akta Notaris) - v26 (Robust Fix)
Updates:
1. Page 1 Start Logic: Triggered precisely by "Pada hari ini".
2. Middle Page Logic: Adjusted top margin to prevent lines starting too high.
3. Last Page Logic: Robust stop trigger preventing lines over signatures.
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
        self.deed_type = deed_type.lower() 
        
        # --- Customization Parameters ---
        self.line_offset = 8
        self.indent_tolerance = 5
        self.line_gap_tolerance = 25
        
        # --- Visual Adjustments ---
        self.visual_top_adjustment = 2 
        self.header_threshold = 50 
        self.footer_zone_start = 0.95 
        self.line_bottom_clamp = 0.90 # Batas bawah garis (90% halaman)

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
                
                page_rect = page.rect
                blocks = page.get_text("blocks")
                content_blocks = []

                for b in blocks:
                    if b[1] > page_rect.height * self.footer_zone_start:
                        continue
                    
                    if page_num > 0 and b[1] < self.header_threshold:
                        continue
                        
                    content_blocks.append(b)

                if not content_blocks:
                    continue
                
                # Sort by vertical position (y0)
                content_blocks.sort(key=lambda b: b[1])

                # --- LOGIC HALAMAN 1 (Start Trigger) ---
                if page_num == 0:
                    start_keyword = "pada hari ini"
                    start_index = -1
                    
                    for i, block in enumerate(content_blocks):
                        text = block[4].lower().strip()
                        # Cek apakah blok mengandung kata kunci pembuka akta
                        if start_keyword in text:
                            start_index = i
                            break
                    
                    if start_index != -1:
                        content_blocks = content_blocks[start_index:]
                        print(f"  [Page 1] Starting lines from: 'Pada hari ini...'")
                    else:
                        print(f"  [Page 1 Warning] '{start_keyword}' not found. Using default top.")

                # --- LOGIC HALAMAN TERAKHIR (Stop Trigger) ---
                if page_num == len(doc) - 1:
                    stop_phrases = [
                        "minuta akta ini telah ditandatangani",
                        "diberikan sebagai salinan",
                        "dibuat dengan tanpa perubahan"
                    ]
                    
                    cutoff_index = -1
                    
                    for i, block in enumerate(content_blocks):
                        text = block[4].lower()
                        if any(phrase in text for phrase in stop_phrases):
                            cutoff_index = i
                            break # Ketemu baris penutup
                    
                    if cutoff_index != -1:
                        content_blocks = content_blocks[:cutoff_index + 3]
                        print(f"  [Last Page] Stopping lines at closing phrase.")
                    else:
                        pass 

                # --- Drawing Logic ---
                if not content_blocks:
                    continue

                line_segments = []
                # Inisialisasi segmen pertama
                current_segment = {
                    "x": content_blocks[0][0], 
                    "y0": content_blocks[0][1] + self.visual_top_adjustment, # Tweak visual atas
                    "y1": min(content_blocks[0][3], page_rect.height * self.line_bottom_clamp)
                }

                for i in range(1, len(content_blocks)):
                    prev_block = content_blocks[i-1]
                    current_block = content_blocks[i]
                    
                    current_x = current_block[0]
                    current_y0 = current_block[1] + self.visual_top_adjustment
                    current_y1 = min(current_block[3], page_rect.height * self.line_bottom_clamp)

                    is_same_indent = abs(current_x - current_segment["x"]) < self.indent_tolerance
                    
                    is_vertically_close = (current_y0 - prev_block[3]) < self.line_gap_tolerance

                    if is_same_indent and is_vertically_close:
                        current_segment["y1"] = current_y1
                    else:
                        line_segments.append(current_segment)
                        current_segment = {"x": current_x, "y0": current_y0, "y1": current_y1}
                
                line_segments.append(current_segment)

                overlay_buffer = BytesIO()
                c = canvas.Canvas(overlay_buffer, pagesize=(page_rect.width, page_rect.height))
                
                if self.deed_type == "minuta":
                    c.setStrokeColorRGB(0, 0, 0) # Hitam
                else:
                    c.setStrokeColorRGB(1, 0, 0) # Merah (Default Salinan)

                c.setLineWidth(0.5)
                
                for segment in line_segments:
                    line_x = segment["x"] - self.line_offset
                    # ReportLab koordinat (0,0) ada di kiri bawah, PDF biasa di kiri atas
                    # Kita harus membalik koordinat Y
                    y_start_rl = page_rect.height - segment["y0"]
                    y_end_rl = page_rect.height - segment["y1"]
                    
                    # Safety check agar tidak menggambar di margin kiri ekstrem
                    if line_x > 5:
                        c.line(line_x, y_start_rl, line_x, y_end_rl)

                # Gambar "Cawang" / Diagonal Ticks pada awal dan akhir dokumen
                if line_segments:
                    # Diagonal Atas (Hanya di segmen pertama page 1, atau setiap page? 
                    # Biasanya setiap putusnya garis ada diagonal, tapi di logic lama 
                    # hanya first dan last dari list segment per halaman)
                    
                    first_seg = line_segments[0]
                    last_seg = line_segments[-1]
                    
                    # Gambar tick di atas garis paling pertama halaman ini
                    self._draw_top_diagonal(c, first_seg["x"] - self.line_offset, page_rect.height - first_seg["y0"])
                    
                    # Gambar tick di bawah garis paling akhir halaman ini
                    self._draw_bottom_diagonal(c, last_seg["x"] - self.line_offset, page_rect.height - last_seg["y1"])
                
                c.save()
                overlay_buffer.seek(0)
                
                # Merge overlay
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
        y_shifted = y - v_shift # Geser sedikit ke bawah agar center dengan ujung garis
        x_start, x_end = x - (self.diagonal_line_length / 2), x + (self.diagonal_line_length / 2)
        y_top, y_bottom = y_shifted + (offset / 2), y_shifted - (offset / 2)
        # Bentuk Z atau double strike
        c.line(x_start, y_top, x_end, y_top + self.diagonal_line_height)
        c.line(x_start, y_bottom, x_end, y_bottom + self.diagonal_line_height)

    def _draw_bottom_diagonal(self, c, x, y):
        c.setLineWidth(0.5)
        offset, v_shift = 4, 8
        y_shifted = y + v_shift # Geser sedikit ke atas
        x_start, x_end = x - (self.diagonal_line_length / 2), x + (self.diagonal_line_length / 2)
        y_top, y_bottom = y_shifted + (offset / 2), y_shifted - (offset / 2)
        c.line(x_start, y_top, x_end, y_top - self.diagonal_line_height)
        c.line(x_start, y_bottom, x_end, y_bottom - self.diagonal_line_height)

def main():
    print("=" * 60)
    print("TOOL GARIS AKTA NOTARIS - V26 (FIXED)")
    print("2025 | assidiqiemirza@gmail.com")
    print("=" * 60)
    
    args = sys.argv[1:]
    if len(args) < 1:
        print("Usage: python index.py <input_pdf> [output_pdf] [--type <salinan|minuta>]")
        return
    
    input_pdf = args[0]
    deed_type = "salinan" # Default

    if "--type" in args:
        try:
            type_index = args.index("--type")
            deed_type = args[type_index + 1].lower()
        except IndexError:
            pass

    output_pdf = ""
    if len(args) > 1 and not args[1].startswith('--'):
        output_pdf = args[1]
    else:
        suffix = f"_{deed_type.upper()}.pdf"
        output_pdf = input_pdf.rsplit('.', 1)[0] + suffix

    if not os.path.exists(input_pdf):
        print(f"Error: File '{input_pdf}' tidak ditemukan")
        return
    
    formatter = NotarialDeedFormatter(input_pdf, output_pdf, deed_type=deed_type)
    if formatter.add_red_lines_to_pdf():
        print("\n" + "=" * 60)
        print(f"SUKSES! File tersimpan di:\n{output_pdf}")
        print("=" * 60)
    else:
        print("\nGagal memformat PDF.")

if __name__ == "__main__":
    main()