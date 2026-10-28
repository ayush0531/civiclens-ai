import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from thesis_data import METADATA, ABSTRACT_TEXT, KEYWORDS, REFERENCES
from thesis_chapters import PAGES_DATA

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGURES_DIR = os.path.join(BASE_DIR, "figures")
DOCX_OUTPUT_PATH = os.path.join(BASE_DIR, "CivicLens_AI_Thesis.docx")

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def build_docx():
    doc = docx.Document()

    # Set Margins to 0.75 inches
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        section.different_first_page_header_footer = True

        # Header for subsequent pages
        header = section.header
        hp = header.paragraphs[0]
        hp.text = "CivicLens AI — Undergraduate B.Tech Capstone Research Thesis\tDept. of AI, GHRCEN"
        hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in hp.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(100, 116, 139)

        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = "G H Raisoni College of Engineering, Nagpur (Autonomous Institute)\tAcademic Year 2026–2027"
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in fp.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(100, 116, 139)

    # Base Colors
    navy_color = RGBColor(15, 23, 42)
    teal_color = RGBColor(13, 148, 136)
    slate_color = RGBColor(51, 65, 85)

    for idx, page in enumerate(PAGES_DATA):
        ptype = page["page_type"]

        # -------------------------------------------------------------
        # PAGE 1: TITLE PAGE
        # -------------------------------------------------------------
        if ptype == "title":
            p_inst = doc.add_paragraph()
            p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r1 = p_inst.add_run("G H RAISONI COLLEGE OF ENGINEERING, NAGPUR\n")
            r1.bold = True
            r1.font.size = Pt(13)
            r1.font.name = "Times New Roman"
            r1.font.color.rgb = navy_color

            r2 = p_inst.add_run("(An Autonomous Institute Affiliated to Rashtrasant Tukadoji Maharaj Nagpur University)\nCRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur, Maharashtra 440016\n")
            r2.font.size = Pt(9.5)
            r2.font.name = "Times New Roman"
            r2.font.color.rgb = slate_color

            p_dept = doc.add_paragraph()
            p_dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r3 = p_dept.add_run("\nDEPARTMENT OF ARTIFICIAL INTELLIGENCE\n")
            r3.bold = True
            r3.font.size = Pt(12)
            r3.font.name = "Times New Roman"
            r3.font.color.rgb = teal_color

            # Title
            p_title = doc.add_paragraph()
            p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_title.paragraph_format.space_before = Pt(20)
            p_title.paragraph_format.space_after = Pt(20)
            r4 = p_title.add_run(page["title"])
            r4.bold = True
            r4.font.size = Pt(18)
            r4.font.name = "Times New Roman"
            r4.font.color.rgb = navy_color

            p_sub = doc.add_paragraph()
            p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_sub.paragraph_format.space_after = Pt(30)
            r5 = p_sub.add_run(page["subtitle"])
            r5.italic = True
            r5.font.size = Pt(10)
            r5.font.name = "Times New Roman"
            r5.font.color.rgb = slate_color

            # Table for Candidate & Guide
            table = doc.add_table(rows=2, cols=2)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            c00 = table.cell(0, 0)
            c01 = table.cell(0, 1)
            c10 = table.cell(1, 0)
            c11 = table.cell(1, 1)

            c00.paragraphs[0].add_run("SUBMITTED BY:").bold = True
            c01.paragraphs[0].add_run("UNDER THE GUIDANCE OF:").bold = True
            c10.paragraphs[0].add_run(f"{page['author']}\nRoll No: {page['roll_no']}\nFinal Year B.Tech, Artificial Intelligence")
            c11.paragraphs[0].add_run(f"{page['guide']}\nDepartment of Artificial Intelligence\nGHRCEN, Nagpur")

            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        for run in p.runs:
                            run.font.name = "Times New Roman"
                            run.font.size = Pt(9.5)

            p_yr = doc.add_paragraph()
            p_yr.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_yr.paragraph_format.space_before = Pt(45)
            ryr = p_yr.add_run("ACADEMIC YEAR: 2026–2027")
            ryr.bold = True
            ryr.font.size = Pt(11)
            ryr.font.name = "Times New Roman"
            ryr.font.color.rgb = navy_color

            doc.add_page_break()

        # -------------------------------------------------------------
        # PAGE 2: CERTIFICATE OF APPROVAL
        # -------------------------------------------------------------
        elif ptype == "certificate":
            p_dept = doc.add_paragraph()
            p_dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rd = p_dept.add_run("DEPARTMENT OF ARTIFICIAL INTELLIGENCE\nG H RAISONI COLLEGE OF ENGINEERING, NAGPUR\n")
            rd.bold = True
            rd.font.size = Pt(12)
            rd.font.name = "Times New Roman"
            rd.font.color.rgb = navy_color

            p_h = doc.add_paragraph()
            p_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_h.paragraph_format.space_before = Pt(10)
            p_h.paragraph_format.space_after = Pt(20)
            rh = p_h.add_run("CERTIFICATE OF APPROVAL")
            rh.bold = True
            rh.font.size = Pt(14)
            rh.font.name = "Times New Roman"
            rh.font.color.rgb = teal_color

            p1 = doc.add_paragraph()
            p1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p1.paragraph_format.space_after = Pt(12)
            rp1 = p1.add_run(page["text_p1"])
            rp1.font.size = Pt(10)
            rp1.font.name = "Times New Roman"

            p2 = doc.add_paragraph()
            p2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p2.paragraph_format.space_after = Pt(40)
            rp2 = p2.add_run(page["text_p2"])
            rp2.font.size = Pt(10)
            rp2.font.name = "Times New Roman"

            # Signatories Table
            sig_table = doc.add_table(rows=2, cols=2)
            sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            sig_table.cell(0, 0).paragraphs[0].add_run("____________________________\nProject Guide\n" + page["signatories"][0][1])
            sig_table.cell(0, 1).paragraphs[0].add_run("____________________________\nHead of Department\n" + page["signatories"][1][1])
            sig_table.cell(1, 0).paragraphs[0].add_run("\n\n____________________________\nExternal Examiner\n" + page["signatories"][2][1])
            sig_table.cell(1, 1).paragraphs[0].add_run("\n\n____________________________\nDirector / Principal\n" + page["signatories"][3][1])

            for row in sig_table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        for run in p.runs:
                            run.font.name = "Times New Roman"
                            run.font.size = Pt(9)

            p_date = doc.add_paragraph()
            p_date.paragraph_format.space_before = Pt(30)
            p_date.add_run("Date: ________________________\t\t\tOfficial Institutional Seal:")

            doc.add_page_break()

        # -------------------------------------------------------------
        # PAGE 3: DECLARATION & ACKNOWLEDGEMENTS
        # -------------------------------------------------------------
        elif ptype == "declaration":
            p_h = doc.add_paragraph()
            rh = p_h.add_run("CANDIDATE DECLARATION")
            rh.bold = True
            rh.font.size = Pt(14)
            rh.font.name = "Times New Roman"
            rh.font.color.rgb = navy_color

            pd = doc.add_paragraph()
            pd.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            pd.paragraph_format.space_after = Pt(20)
            rd = pd.add_run(page["declaration_text"])
            rd.font.size = Pt(10)
            rd.font.name = "Times New Roman"

            ps = doc.add_paragraph()
            ps.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            ps.paragraph_format.space_after = Pt(25)
            rs = ps.add_run("____________________________________\nAyush Vinchurkar\nRoll No: 2023-BTECH-AI-042\nFinal Year B.Tech Artificial Intelligence\nGHRCEN, Nagpur")
            rs.font.size = Pt(9.5)
            rs.font.name = "Times New Roman"

            pa_h = doc.add_paragraph()
            rah = pa_h.add_run("ACKNOWLEDGEMENTS")
            rah.bold = True
            rah.font.size = Pt(14)
            rah.font.name = "Times New Roman"
            rah.font.color.rgb = navy_color

            for p in page["ack_text"].split("\n\n"):
                pa = doc.add_paragraph()
                pa.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                pa.paragraph_format.space_after = Pt(8)
                ra = pa.add_run(p)
                ra.font.size = Pt(10)
                ra.font.name = "Times New Roman"

            doc.add_page_break()

        # -------------------------------------------------------------
        # PAGE 4: ABSTRACT & KEYWORDS
        # -------------------------------------------------------------
        elif ptype == "abstract":
            p_h = doc.add_paragraph()
            rh = p_h.add_run("ABSTRACT")
            rh.bold = True
            rh.font.size = Pt(14)
            rh.font.name = "Times New Roman"
            rh.font.color.rgb = navy_color

            for p in page["abstract_body"].split("\n\n"):
                pa = doc.add_paragraph()
                pa.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                pa.paragraph_format.space_after = Pt(10)
                ra = pa.add_run(p)
                ra.font.size = Pt(10)
                ra.font.name = "Times New Roman"

            p_kw = doc.add_paragraph()
            p_kw.paragraph_format.space_before = Pt(20)
            r_kw_l = p_kw.add_run("Keywords: ")
            r_kw_l.bold = True
            r_kw_l.font.size = Pt(10)
            r_kw_l.font.name = "Times New Roman"
            r_kw = p_kw.add_run(", ".join(page["keywords"]))
            r_kw.font.size = Pt(10)
            r_kw.font.name = "Times New Roman"

            doc.add_page_break()

        # -------------------------------------------------------------
        # PAGE 5: TABLE OF CONTENTS & LIST OF ILLUSTRATIONS
        # -------------------------------------------------------------
        elif ptype == "toc":
            p_h = doc.add_paragraph()
            rh = p_h.add_run("TABLE OF CONTENTS")
            rh.bold = True
            rh.font.size = Pt(14)
            rh.font.name = "Times New Roman"
            rh.font.color.rgb = navy_color

            toc_table = doc.add_table(rows=0, cols=2)
            toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            for item, pg in page["toc_items"]:
                row = toc_table.add_row()
                row.cells[0].paragraphs[0].add_run(item)
                row.cells[1].paragraphs[0].add_run(pg).bold = True
                row.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
                for c in row.cells:
                    for run in c.paragraphs[0].runs:
                        run.font.name = "Times New Roman"
                        run.font.size = Pt(9)

            p_h2 = doc.add_paragraph()
            p_h2.paragraph_format.space_before = Pt(16)
            rh2 = p_h2.add_run("LIST OF ILLUSTRATIONS & TABLES")
            rh2.bold = True
            rh2.font.size = Pt(12)
            rh2.font.name = "Times New Roman"
            rh2.font.color.rgb = teal_color

            ill_table = doc.add_table(rows=0, cols=2)
            ill_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            for item, pg in page["figures_list"] + page["tables_list"]:
                row = ill_table.add_row()
                row.cells[0].paragraphs[0].add_run(item)
                row.cells[1].paragraphs[0].add_run(pg).bold = True
                row.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
                for c in row.cells:
                    for run in c.paragraphs[0].runs:
                        run.font.name = "Times New Roman"
                        run.font.size = Pt(8.5)

            doc.add_page_break()

        # -------------------------------------------------------------
        # CHAPTERS (Pages 6 through 20)
        # -------------------------------------------------------------
        elif ptype == "chapter":
            c_num = page["chapter_no"]
            c_title = page["title"]

            p_c = doc.add_paragraph()
            rc = p_c.add_run(f"CHAPTER {c_num}")
            rc.bold = True
            rc.font.size = Pt(11)
            rc.font.name = "Times New Roman"
            rc.font.color.rgb = teal_color

            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_after = Pt(12)
            rh = p_h.add_run(c_title)
            rh.bold = True
            rh.font.size = Pt(15)
            rh.font.name = "Times New Roman"
            rh.font.color.rgb = navy_color

            for sec in page["sections"]:
                ps = doc.add_paragraph()
                ps.paragraph_format.space_before = Pt(8)
                ps.paragraph_format.space_after = Pt(4)
                rs = ps.add_run(f"{sec['sec_no']} {sec['heading']}")
                rs.bold = True
                rs.font.size = Pt(11.5)
                rs.font.name = "Times New Roman"
                rs.font.color.rgb = teal_color

                for p in sec["content"].split("\n\n"):
                    if p.startswith("• "):
                        for b_item in p.split("\n"):
                            pb = doc.add_paragraph(style='List Bullet')
                            pb.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                            pb.paragraph_format.space_after = Pt(3)
                            rb = pb.add_run(b_item.replace("• ", ""))
                            rb.font.size = Pt(10)
                            rb.font.name = "Times New Roman"
                    else:
                        pp = doc.add_paragraph()
                        pp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                        pp.paragraph_format.space_after = Pt(6)
                        rp = pp.add_run(p)
                        rp.font.size = Pt(10)
                        rp.font.name = "Times New Roman"

                # Table in section
                if "table" in sec:
                    tbl_info = sec["table"]
                    p_tc = doc.add_paragraph()
                    p_tc.paragraph_format.space_before = Pt(6)
                    p_tc.paragraph_format.space_after = Pt(3)
                    rtc = p_tc.add_run(f"{tbl_info['id']}: {tbl_info['caption']}")
                    rtc.bold = True
                    rtc.font.size = Pt(9)
                    rtc.font.name = "Times New Roman"

                    t = doc.add_table(rows=len(tbl_info["rows"]) + 1, cols=len(tbl_info["headers"]))
                    t.alignment = WD_TABLE_ALIGNMENT.CENTER
                    # Headers
                    for col_idx, h_text in enumerate(tbl_info["headers"]):
                        cell = t.cell(0, col_idx)
                        set_cell_background(cell, "0F172A")
                        p_c = cell.paragraphs[0]
                        run = p_c.add_run(h_text)
                        run.bold = True
                        run.font.size = Pt(8.5)
                        run.font.name = "Times New Roman"
                        run.font.color.rgb = RGBColor(255, 255, 255)
                        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

                    # Rows
                    for row_idx, r_data in enumerate(tbl_info["rows"]):
                        bg = "FFFFFF" if row_idx % 2 == 0 else "F8FAFC"
                        for col_idx, cell_value in enumerate(r_data):
                            cell = t.cell(row_idx + 1, col_idx)
                            set_cell_background(cell, bg)
                            p_c = cell.paragraphs[0]
                            run = p_c.add_run(cell_value)
                            run.font.size = Pt(8.5)
                            run.font.name = "Times New Roman"
                            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)

                # Figure in section
                if "figure" in sec:
                    fig_info = sec["figure"]
                    fig_name = os.path.basename(fig_info["path"])
                    full_fig_path = os.path.join(FIGURES_DIR, fig_name)
                    if os.path.exists(full_fig_path):
                        p_img = doc.add_paragraph()
                        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        p_img.paragraph_format.space_before = Pt(8)
                        p_img.paragraph_format.space_after = Pt(2)
                        p_img.add_run().add_picture(full_fig_path, width=Inches(5.8))

                        p_cap = doc.add_paragraph()
                        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        p_cap.paragraph_format.space_after = Pt(8)
                        rcap = p_cap.add_run(fig_info["caption"])
                        rcap.italic = True
                        rcap.font.size = Pt(8.5)
                        rcap.font.name = "Times New Roman"
                        rcap.font.color.rgb = navy_color

            doc.add_page_break()

        # -------------------------------------------------------------
        # PAGE 21: REFERENCES
        # -------------------------------------------------------------
        elif ptype == "references":
            p_c = doc.add_paragraph()
            rc = p_c.add_run(f"CHAPTER {page['chapter_no']}")
            rc.bold = True
            rc.font.size = Pt(11)
            rc.font.name = "Times New Roman"
            rc.font.color.rgb = teal_color

            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_after = Pt(14)
            rh = p_h.add_run(page["title"])
            rh.bold = True
            rh.font.size = Pt(15)
            rh.font.name = "Times New Roman"
            rh.font.color.rgb = navy_color

            for ref in REFERENCES:
                pr = doc.add_paragraph()
                pr.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                pr.paragraph_format.left_indent = Inches(0.35)
                pr.paragraph_format.first_line_indent = Inches(-0.35)
                pr.paragraph_format.space_after = Pt(6)
                r_id = pr.add_run(f"[{ref['id']}] ")
                r_id.bold = True
                r_id.font.size = Pt(9)
                r_id.font.name = "Times New Roman"
                r_cit = pr.add_run(ref["citation"])
                r_cit.font.size = Pt(9)
                r_cit.font.name = "Times New Roman"

            doc.add_page_break()

        # -------------------------------------------------------------
        # PAGE 22: APPENDIX
        # -------------------------------------------------------------
        elif ptype == "appendix":
            p_c = doc.add_paragraph()
            rc = p_c.add_run("APPENDIX")
            rc.bold = True
            rc.font.size = Pt(11)
            rc.font.name = "Times New Roman"
            rc.font.color.rgb = teal_color

            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_after = Pt(12)
            rh = p_h.add_run(page["title"])
            rh.bold = True
            rh.font.size = Pt(15)
            rh.font.name = "Times New Roman"
            rh.font.color.rgb = navy_color

            for sec in page["sections"]:
                ps = doc.add_paragraph()
                ps.paragraph_format.space_before = Pt(8)
                ps.paragraph_format.space_after = Pt(4)
                rs = ps.add_run(f"{sec['sec_no']} {sec['heading']}")
                rs.bold = True
                rs.font.size = Pt(11.5)
                rs.font.name = "Times New Roman"
                rs.font.color.rgb = teal_color

                if "figure" in sec:
                    fig_info = sec["figure"]
                    fig_name = os.path.basename(fig_info["path"])
                    full_fig_path = os.path.join(FIGURES_DIR, fig_name)
                    if os.path.exists(full_fig_path):
                        p_img = doc.add_paragraph()
                        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        p_img.add_run().add_picture(full_fig_path, width=Inches(5.8))
                        p_cap = doc.add_paragraph()
                        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        rcap = p_cap.add_run(fig_info["caption"])
                        rcap.italic = True
                        rcap.font.size = Pt(8.5)
                        rcap.font.name = "Times New Roman"

                for p in sec["content"].split("\n\n"):
                    pp = doc.add_paragraph()
                    pp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                    pp.paragraph_format.space_after = Pt(4)
                    rp = pp.add_run(p)
                    rp.font.size = Pt(9.5)
                    rp.font.name = "Times New Roman"

    doc.save(DOCX_OUTPUT_PATH)
    print(f"Word Document built successfully at: {DOCX_OUTPUT_PATH}")

if __name__ == "__main__":
    build_docx()
