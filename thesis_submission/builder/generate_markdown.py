import os
import sys

from thesis_data import METADATA, ABSTRACT_TEXT, KEYWORDS, REFERENCES
from thesis_chapters import PAGES_DATA

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD_OUTPUT_PATH = os.path.join(BASE_DIR, "CivicLens_AI_Thesis.md")

def build_markdown():
    lines = []

    # Title & Metadata
    lines.append(f"# {METADATA['title']}")
    lines.append(f"## {METADATA['subtitle']}\n")
    lines.append(f"**Author:** {METADATA['author']} (Roll No: {METADATA['roll_no']})  ")
    lines.append(f"**Degree:** {METADATA['degree']} in {METADATA['branch']}  ")
    lines.append(f"**Institution:** {METADATA['institution']}, {METADATA['city']}  ")
    lines.append(f"**Affiliation:** {METADATA['institution_sub']}  ")
    lines.append(f"**Guide:** {METADATA['guide_name']}, {METADATA['guide_designation']}  ")
    lines.append(f"**Academic Year:** {METADATA['academic_year']} | **Date:** {METADATA['date']}\n")
    lines.append("---\n")

    for page in PAGES_DATA:
        ptype = page["page_type"]

        if ptype == "title":
            continue

        elif ptype == "certificate":
            lines.append("## CERTIFICATE OF APPROVAL\n")
            lines.append(page["text_p1"] + "\n")
            lines.append(page["text_p2"] + "\n")
            lines.append("| Signatory Role | Name & Designation | Signature Field |")
            lines.append("| :--- | :--- | :--- |")
            for role, desig in page["signatories"]:
                lines.append(f"| **{role}** | {desig.replace(chr(10), '<br/>')} | `[ SIGNATURE & SEAL ]` |")
            lines.append("\n---\n")

        elif ptype == "declaration":
            lines.append("## CANDIDATE DECLARATION\n")
            lines.append(page["declaration_text"] + "\n")
            lines.append(f"**Candidate:** {page['student_sig'].replace(chr(10), '<br/>')}\n")
            lines.append("### ACKNOWLEDGEMENTS\n")
            lines.append(page["ack_text"] + "\n")
            lines.append("---\n")

        elif ptype == "abstract":
            lines.append("## ABSTRACT\n")
            lines.append(page["abstract_body"] + "\n")
            lines.append(f"**Keywords:** {', '.join(page['keywords'])}\n")
            lines.append("---\n")

        elif ptype == "toc":
            lines.append("## TABLE OF CONTENTS\n")
            lines.append("| Chapter / Section | Page Allocation |")
            lines.append("| :--- | :--- |")
            for item, pg in page["toc_items"]:
                lines.append(f"| {item} | **{pg}** |")
            lines.append("\n### List of Figures\n")
            lines.append("| Figure Identifier & Description | Page |")
            lines.append("| :--- | :--- |")
            for item, pg in page["figures_list"]:
                lines.append(f"| {item} | **{pg}** |")
            lines.append("\n### List of Tables\n")
            lines.append("| Table Identifier & Description | Page |")
            lines.append("| :--- | :--- |")
            for item, pg in page["tables_list"]:
                lines.append(f"| {item} | **{pg}** |")
            lines.append("\n---\n")

        elif ptype == "chapter":
            c_num = page["chapter_no"]
            c_title = page["title"]
            lines.append(f"# Chapter {c_num}: {c_title}\n")

            for sec in page["sections"]:
                lines.append(f"## {sec['sec_no']} {sec['heading']}\n")
                lines.append(sec["content"] + "\n")

                if "table" in sec:
                    tbl = sec["table"]
                    lines.append(f"\n#### {tbl['id']}: {tbl['caption']}\n")
                    lines.append("| " + " | ".join(tbl["headers"]) + " |")
                    lines.append("| " + " | ".join([":---"] * len(tbl["headers"])) + " |")
                    for row in tbl["rows"]:
                        lines.append("| " + " | ".join(row) + " |")
                    lines.append("\n")

                if "figure" in sec:
                    fig = sec["figure"]
                    lines.append(f"\n![{fig['caption']}]({fig['path']})\n")
                    lines.append(f"*{fig['caption']}*\n")

            lines.append("---\n")

        elif ptype == "references":
            lines.append(f"# Chapter {page['chapter_no']}: {page['title']}\n")
            for ref in REFERENCES:
                lines.append(f"**[{ref['id']}]** {ref['citation']}\n")
            lines.append("---\n")

        elif ptype == "appendix":
            lines.append(f"# {page['title']}\n")
            for sec in page["sections"]:
                lines.append(f"## {sec['sec_no']} {sec['heading']}\n")
                if "figure" in sec:
                    fig = sec["figure"]
                    lines.append(f"\n![{fig['caption']}]({fig['path']})\n")
                    lines.append(f"*{fig['caption']}*\n")
                lines.append(sec["content"] + "\n")

    with open(MD_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Markdown source built successfully at: {MD_OUTPUT_PATH}")

if __name__ == "__main__":
    build_markdown()
