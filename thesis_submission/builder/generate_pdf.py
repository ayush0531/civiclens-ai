import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

from thesis_data import METADATA, ABSTRACT_TEXT, KEYWORDS, REFERENCES
from thesis_chapters import PAGES_DATA

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGURES_DIR = os.path.join(BASE_DIR, "figures")
PDF_OUTPUT_PATH = os.path.join(BASE_DIR, "CivicLens_AI_Thesis.pdf")

# Custom Canvas for Two-Pass Page Numbering & Running Headers/Footers
class AcademicNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        # Do not draw headers or footers on Title Page (Page 1)
        if self._pageNumber == 1:
            return

        self.saveState()
        self.setFont("Times-Roman", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)

        # Running Header (Top of Page)
        self.drawString(54, 805, "CivicLens AI — Undergraduate B.Tech Capstone Research Thesis")
        self.drawRightString(595.27 - 54, 805, "Dept. of Artificial Intelligence, GHRCEN")
        self.line(54, 799, 595.27 - 54, 799)

        # Running Footer (Bottom of Page)
        self.drawString(54, 34, "G H Raisoni College of Engineering, Nagpur (Autonomous Institute)")
        self.drawRightString(595.27 - 54, 34, f"Page {self._pageNumber} of {page_count}")
        self.line(54, 42, 595.27 - 54, 42)

        self.restoreState()


def build_pdf():
    # A4: 595.27 x 841.89 points. Margins: 54 pt (0.75 in)
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Academic Palette
    c_navy = colors.HexColor("#0f172a")
    c_teal = colors.HexColor("#0d9488")
    c_slate = colors.HexColor("#334155")
    c_muted = colors.HexColor("#64748b")
    c_border = colors.HexColor("#cbd5e1")
    c_bg_light = colors.HexColor("#f8fafc")

    # Typography Styles
    title_univ = ParagraphStyle(
        "TitleUniv",
        fontName="Times-Bold",
        fontSize=12,
        leading=16,
        alignment=TA_CENTER,
        textColor=c_navy
    )
    title_sub = ParagraphStyle(
        "TitleSub",
        fontName="Times-Roman",
        fontSize=9.5,
        leading=13,
        alignment=TA_CENTER,
        textColor=c_slate
    )
    title_main = ParagraphStyle(
        "TitleMain",
        fontName="Times-Bold",
        fontSize=17,
        leading=22,
        alignment=TA_CENTER,
        textColor=c_navy
    )
    title_report = ParagraphStyle(
        "TitleReport",
        fontName="Times-Italic",
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=c_slate
    )
    h1_style = ParagraphStyle(
        "Heading1_Custom",
        fontName="Times-Bold",
        fontSize=14.5,
        leading=18,
        alignment=TA_LEFT,
        textColor=c_navy,
        spaceBefore=0,
        spaceAfter=6
    )
    h2_style = ParagraphStyle(
        "Heading2_Custom",
        fontName="Times-Bold",
        fontSize=11,
        leading=15,
        alignment=TA_LEFT,
        textColor=c_teal,
        spaceBefore=6,
        spaceAfter=3
    )
    body_style = ParagraphStyle(
        "Body_Custom",
        fontName="Times-Roman",
        fontSize=9.5,
        leading=13.5,
        alignment=TA_JUSTIFY,
        textColor=c_slate,
        spaceBefore=0,
        spaceAfter=4
    )
    caption_style = ParagraphStyle(
        "Caption_Custom",
        fontName="Times-Italic",
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=c_navy,
        spaceBefore=2,
        spaceAfter=4
    )
    code_style = ParagraphStyle(
        "Code_Custom",
        fontName="Courier",
        fontSize=7.5,
        leading=9.5,
        alignment=TA_LEFT,
        textColor=c_navy,
        spaceBefore=2,
        spaceAfter=2
    )
    table_cell = ParagraphStyle(
        "TableCell",
        fontName="Times-Roman",
        fontSize=8,
        leading=10.5,
        alignment=TA_LEFT,
        textColor=c_slate
    )
    table_hdr = ParagraphStyle(
        "TableHdr",
        fontName="Times-Bold",
        fontSize=8,
        leading=10.5,
        alignment=TA_LEFT,
        textColor=colors.white
    )

    story = []

    for idx, page in enumerate(PAGES_DATA):
        ptype = page["page_type"]

        # -------------------------------------------------------------
        # PAGE 1: FORMAL TITLE PAGE
        # -------------------------------------------------------------
        if ptype == "title":
            story.append(Spacer(1, 15))
            story.append(Paragraph("G H RAISONI COLLEGE OF ENGINEERING, NAGPUR", title_univ))
            story.append(Paragraph("(An Autonomous Institute Affiliated to Rashtrasant Tukadoji Maharaj Nagpur University)", title_sub))
            story.append(Paragraph("CRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur, Maharashtra 440016", title_sub))
            story.append(Spacer(1, 20))

            # Department
            story.append(Paragraph("DEPARTMENT OF ARTIFICIAL INTELLIGENCE", ParagraphStyle(
                "DeptHdr", fontName="Times-Bold", fontSize=12, leading=15, alignment=TA_CENTER, textColor=c_teal
            )))
            story.append(Spacer(1, 25))

            # Institutional Decorative Rule
            story.append(Table([[""]], colWidths=[487], rowHeights=[2], style=TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), c_navy),
                ('TOPPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ])))
            story.append(Spacer(1, 15))

            # Project Title
            story.append(Paragraph(page["title"], title_main))
            story.append(Spacer(1, 15))
            story.append(Table([[""]], colWidths=[487], rowHeights=[1], style=TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), c_teal),
                ('TOPPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ])))
            story.append(Spacer(1, 20))

            # Degree Subtitle
            story.append(Paragraph(page["subtitle"], title_report))
            story.append(Spacer(1, 30))

            # Student & Guide Block
            auth_data = [
                [
                    Paragraph("<b>SUBMITTED BY:</b>", ParagraphStyle("AuthH", fontName="Times-Bold", fontSize=9, leading=12, textColor=c_navy)),
                    Paragraph("<b>UNDER THE GUIDANCE OF:</b>", ParagraphStyle("GuidH", fontName="Times-Bold", fontSize=9, leading=12, textColor=c_navy))
                ],
                [
                    Paragraph(f"<b>{page['author']}</b><br/>Roll No: {page['roll_no']}<br/>Final Year B.Tech, Artificial Intelligence", table_cell),
                    Paragraph(f"<b>{page['guide']}</b><br/>Department of Artificial Intelligence<br/>GHRCEN, Nagpur", table_cell)
                ]
            ]
            t_auth = Table(auth_data, colWidths=[240, 247])
            t_auth.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(t_auth)
            story.append(Spacer(1, 45))

            # Academic Year Footer
            story.append(Paragraph("<b>ACADEMIC YEAR: 2026–2027</b>", ParagraphStyle(
                "YrHdr", fontName="Times-Bold", fontSize=11, leading=14, alignment=TA_CENTER, textColor=c_navy
            )))
            story.append(PageBreak())

        # -------------------------------------------------------------
        # PAGE 2: CERTIFICATE OF APPROVAL
        # -------------------------------------------------------------
        elif ptype == "certificate":
            story.append(Paragraph("DEPARTMENT OF ARTIFICIAL INTELLIGENCE", ParagraphStyle(
                "CertDept", fontName="Times-Bold", fontSize=11, leading=14, alignment=TA_CENTER, textColor=c_teal
            )))
            story.append(Paragraph("G H RAISONI COLLEGE OF ENGINEERING, NAGPUR", title_univ))
            story.append(Paragraph("(An Autonomous Institute Affiliated to Rashtrasant Tukadoji Maharaj Nagpur University)", title_sub))
            story.append(Spacer(1, 15))

            story.append(Paragraph("CERTIFICATE OF APPROVAL", ParagraphStyle(
                "CertHead", fontName="Times-Bold", fontSize=14, leading=18, alignment=TA_CENTER, textColor=c_navy
            )))
            story.append(Spacer(1, 15))

            story.append(Paragraph(page["text_p1"], body_style))
            story.append(Spacer(1, 8))
            story.append(Paragraph(page["text_p2"], body_style))
            story.append(Spacer(1, 40))

            # 4 Signature Fields Block
            sig_data = [
                [
                    Paragraph("____________________________<br/><b>Project Guide</b><br/>" + page["signatories"][0][1], table_cell),
                    Paragraph("____________________________<br/><b>Head of Department</b><br/>" + page["signatories"][1][1], table_cell)
                ],
                [
                    Spacer(1, 30), Spacer(1, 30)
                ],
                [
                    Paragraph("____________________________<br/><b>External Examiner</b><br/>" + page["signatories"][2][1], table_cell),
                    Paragraph("____________________________<br/><b>Director / Principal</b><br/>" + page["signatories"][3][1], table_cell)
                ]
            ]
            t_sig = Table(sig_data, colWidths=[240, 247])
            t_sig.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(t_sig)
            story.append(Spacer(1, 20))
            story.append(Paragraph("Date: ________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Official Institutional Seal:", table_cell))
            story.append(PageBreak())

        # -------------------------------------------------------------
        # PAGE 3: DECLARATION & ACKNOWLEDGEMENTS
        # -------------------------------------------------------------
        elif ptype == "declaration":
            story.append(Paragraph("CANDIDATE DECLARATION", h1_style))
            story.append(Spacer(1, 6))
            story.append(Paragraph(page["declaration_text"], body_style))
            story.append(Spacer(1, 20))

            sig_block = [
                ["", Paragraph("____________________________________<br/><b>Ayush Vinchurkar</b><br/>Roll No: 2023-BTECH-AI-042<br/>B.Tech Artificial Intelligence, Final Year<br/>GHRCEN, Nagpur", table_cell)]
            ]
            t_s = Table(sig_block, colWidths=[240, 247])
            t_s.setStyle(TableStyle([('ALIGN', (1, 0), (1, 0), 'RIGHT')]))
            story.append(t_s)
            story.append(Spacer(1, 25))

            story.append(Paragraph("ACKNOWLEDGEMENTS", h1_style))
            story.append(Spacer(1, 6))
            for p in page["ack_text"].split("\n\n"):
                story.append(Paragraph(p, body_style))
                story.append(Spacer(1, 5))
            story.append(PageBreak())

        # -------------------------------------------------------------
        # PAGE 4: ABSTRACT & KEYWORDS
        # -------------------------------------------------------------
        elif ptype == "abstract":
            story.append(Paragraph("ABSTRACT", h1_style))
            story.append(Spacer(1, 8))
            for p in page["abstract_body"].split("\n\n"):
                story.append(Paragraph(p, body_style))
                story.append(Spacer(1, 8))

            story.append(Spacer(1, 20))
            kw_text = "<b>Keywords:</b> " + ", ".join(page["keywords"])
            story.append(Paragraph(kw_text, ParagraphStyle(
                "KWStyle", fontName="Times-Roman", fontSize=9.5, leading=13.5, textColor=c_navy
            )))
            story.append(PageBreak())

        # -------------------------------------------------------------
        # PAGE 5: TABLE OF CONTENTS & LIST OF FIGURES/TABLES
        # -------------------------------------------------------------
        elif ptype == "toc":
            story.append(Paragraph("TABLE OF CONTENTS", h1_style))
            story.append(Spacer(1, 4))

            toc_table_data = []
            for item, pg in page["toc_items"]:
                toc_table_data.append([
                    Paragraph(item, table_cell),
                    Paragraph(f"<b>{pg}</b>", ParagraphStyle("TOCPg", fontName="Times-Roman", fontSize=8, leading=10, alignment=TA_RIGHT, textColor=c_navy))
                ])
            t_toc = Table(toc_table_data, colWidths=[420, 67])
            t_toc.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
                ('TOPPADDING', (0, 0), (-1, -1), 1),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('LINEBELOW', (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0"))
            ]))
            story.append(t_toc)
            story.append(Spacer(1, 10))

            story.append(Paragraph("LIST OF ILLUSTRATIONS & TABLES", h2_style))
            story.append(Spacer(1, 3))
            fig_table_data = []
            for f_item, f_pg in page["figures_list"]:
                fig_table_data.append([
                    Paragraph(f_item, table_cell),
                    Paragraph(f"<b>{f_pg}</b>", ParagraphStyle("FigPg", fontName="Times-Roman", fontSize=7.5, leading=9.5, alignment=TA_RIGHT, textColor=c_navy))
                ])
            for t_item, t_pg in page["tables_list"]:
                fig_table_data.append([
                    Paragraph(t_item, table_cell),
                    Paragraph(f"<b>{t_pg}</b>", ParagraphStyle("TblPg", fontName="Times-Roman", fontSize=7.5, leading=9.5, alignment=TA_RIGHT, textColor=c_navy))
                ])
            t_fig = Table(fig_table_data, colWidths=[420, 67])
            t_fig.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0.5),
                ('TOPPADDING', (0, 0), (-1, -1), 0.5),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(t_fig)
            story.append(PageBreak())

        # -------------------------------------------------------------
        # CHAPTER PAGES (6 through 20)
        # -------------------------------------------------------------
        elif ptype == "chapter":
            c_num = page["chapter_no"]
            c_title = page["title"]

            story.append(Paragraph(f"CHAPTER {c_num}", ParagraphStyle(
                "ChapPrefix", fontName="Times-Bold", fontSize=11, leading=14, textColor=c_teal
            )))
            story.append(Paragraph(c_title, h1_style))
            story.append(Spacer(1, 4))

            for sec in page["sections"]:
                story.append(Paragraph(f"{sec['sec_no']} {sec['heading']}", h2_style))
                story.append(Spacer(1, 2))

                # Render paragraphs in section
                for p in sec["content"].split("\n\n"):
                    if p.startswith("• "):
                        bullet_items = p.split("\n")
                        for b_item in bullet_items:
                            story.append(Paragraph(b_item, ParagraphStyle(
                                "BulletP", parent=body_style, leftIndent=12, spaceAfter=2
                            )))
                    else:
                        story.append(Paragraph(p, body_style))
                    story.append(Spacer(1, 3))

                # Render Table if present
                if "table" in sec:
                    tbl = sec["table"]
                    hdr_row = [Paragraph(f"<b>{h}</b>", table_hdr) for h in tbl["headers"]]
                    t_rows = [hdr_row]
                    for r in tbl["rows"]:
                        t_rows.append([Paragraph(cell, table_cell) for cell in r])

                    num_cols = len(tbl["headers"])
                    c_widths = [487 / num_cols] * num_cols
                    # Specialized column width adjustments if 4 columns
                    if num_cols == 4:
                        c_widths = [120, 122, 122, 123]
                    elif num_cols == 7:
                        c_widths = [85, 45, 60, 60, 60, 60, 77]

                    t_flow = Table(t_rows, colWidths=c_widths)
                    t_flow.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), c_navy),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
                        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
                        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ]))
                    story.append(Spacer(1, 3))
                    story.append(t_flow)
                    story.append(Paragraph(f"<b>{tbl['id']}:</b> {tbl['caption']}", caption_style))
                    story.append(Spacer(1, 4))

                # Render Figure if present
                if "figure" in sec:
                    fig_info = sec["figure"]
                    fig_name = os.path.basename(fig_info["path"])
                    full_fig_path = os.path.join(FIGURES_DIR, fig_name)
                    if os.path.exists(full_fig_path):
                        img_w = fig_info.get("width", 440)
                        img_h = fig_info.get("height", 160)
                        story.append(Spacer(1, 2))
                        story.append(Image(full_fig_path, width=img_w, height=img_h))
                        story.append(Paragraph(f"<b>{fig_info['caption']}</b>", caption_style))
                        story.append(Spacer(1, 3))
                    else:
                        print(f"WARNING: Figure not found at {full_fig_path}")

            story.append(PageBreak())

        # -------------------------------------------------------------
        # PAGE 21: REFERENCES
        # -------------------------------------------------------------
        elif ptype == "references":
            story.append(Paragraph(f"CHAPTER {page['chapter_no']}", ParagraphStyle(
                "ChapPrefixRef", fontName="Times-Bold", fontSize=11, leading=14, textColor=c_teal
            )))
            story.append(Paragraph(page["title"], h1_style))
            story.append(Spacer(1, 6))

            for ref in REFERENCES:
                ref_text = f"<b>[{ref['id']}]</b> {ref['citation']}"
                story.append(Paragraph(ref_text, ParagraphStyle(
                    "RefP", parent=body_style, leftIndent=18, firstLineIndent=-18, fontSize=8.5, leading=11.5, spaceAfter=4
                )))
            story.append(PageBreak())

        # -------------------------------------------------------------
        # PAGE 22: APPENDIX
        # -------------------------------------------------------------
        elif ptype == "appendix":
            story.append(Paragraph("APPENDIX", ParagraphStyle(
                "AppPrefix", fontName="Times-Bold", fontSize=11, leading=14, textColor=c_teal
            )))
            story.append(Paragraph(page["title"], h1_style))
            story.append(Spacer(1, 4))

            for sec in page["sections"]:
                story.append(Paragraph(f"{sec['sec_no']} {sec['heading']}", h2_style))
                story.append(Spacer(1, 2))

                if "figure" in sec:
                    fig_info = sec["figure"]
                    fig_name = os.path.basename(fig_info["path"])
                    full_fig_path = os.path.join(FIGURES_DIR, fig_name)
                    if os.path.exists(full_fig_path):
                        story.append(Image(full_fig_path, width=fig_info["width"], height=fig_info["height"]))
                        story.append(Paragraph(f"<b>{fig_info['caption']}</b>", caption_style))
                        story.append(Spacer(1, 3))

                if "```json" in sec["content"]:
                    parts = sec["content"].split("```json")
                    story.append(Paragraph(parts[0], body_style))
                    json_str = parts[1].replace("```", "").strip()
                    story.append(Paragraph(json_str.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
                else:
                    for p in sec["content"].split("\n\n"):
                        story.append(Paragraph(p, body_style))
                        story.append(Spacer(1, 2))

            story.append(PageBreak())

    # Build PDF with custom NumberedCanvas
    doc.build(story, canvasmaker=AcademicNumberedCanvas)
    print(f"PDF built successfully at: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
