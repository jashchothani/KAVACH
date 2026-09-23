"""
KAVACH Report Service — Premium PDF Report Generator.

Uses ReportLab for corporate document structure and Matplotlib for high-fidelity 
pie/bar chart visualizations of security data and threat severity distributions.
"""

import os
import time
from pathlib import Path
import matplotlib
matplotlib.use('Agg')  # Thread-safe headless backend for matplotlib
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from core.config import get_settings


def generate_pdf_report(report_type: str, data: dict, ai_content: str) -> str:
    """
    Generate a high-fidelity PDF report of the SOC or Executive summary.
    Saves it to backend/reports/ folder and returns the filename.
    """
    settings = get_settings()
    reports_dir = settings.paths.reports_dir
    reports_dir.mkdir(parents=True, exist_ok=True)

    timestamp = int(time.time())
    pdf_filename = f"{report_type}_report_{timestamp}.pdf"
    pdf_path = reports_dir / pdf_filename

    # Create PDF document
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette (Cybersecurity Corporate theme)
    primary_color = colors.HexColor("#0f172a")  # Dark slate
    accent_color = colors.HexColor("#00b0ff")   # Electric Cyan
    text_color = colors.HexColor("#334155")     # Cool slate gray

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=primary_color,
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=25
    )

    heading2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=10
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        textColor=text_color,
        leading=14,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph(f"KAVACH Security Report", title_style))
    story.append(Paragraph(
        f"Type: {report_type.upper()} Analyst Summary | Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        subtitle_style
    ))
    story.append(Spacer(1, 10))

    # 2. Key Metrics Table
    story.append(Paragraph("System Posture & Metrics Summary", heading2_style))
    overview = data.get("overview", {})
    system = data.get("system", {})
    pipeline = data.get("pipeline", {})

    metrics_data = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value</b>", body_style), Paragraph("<b>Status</b>", body_style)],
        [Paragraph("Total Alerts Ingested", body_style), Paragraph(str(overview.get("total_alerts", 0)), body_style), Paragraph("Monitoring Active", body_style)],
        [Paragraph("Monitored Endpoints", body_style), Paragraph(str(overview.get("total_devices", 0)), body_style), Paragraph("Secure", body_style)],
        [Paragraph("Open Incidents Queue", body_style), Paragraph(str(overview.get("total_incidents", 0)), body_style), Paragraph("Investigating" if overview.get("total_incidents", 0) > 0 else "Clean", body_style)],
        [Paragraph("Pipeline Processed Events", body_style), Paragraph(str(pipeline.get("processed", 0)), body_style), Paragraph("Optimal", body_style)],
        [Paragraph("System CPU Usage", body_style), Paragraph(f"{system.get('cpu_percent', 0)}%", body_style), Paragraph("Normal", body_style)],
        [Paragraph("System Memory Usage", body_style), Paragraph(f"{system.get('memory_percent', 0)}%", body_style), Paragraph("Normal", body_style)]
    ]

    t = Table(metrics_data, colWidths=[200, 150, 180])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # 3. Generate and embed high-fidelity charts using matplotlib
    chart_paths = []
    try:
        severity_counts = overview.get("severity_counts", {})
        if severity_counts and sum(severity_counts.values()) > 0:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

            # Pie Chart
            sevs = list(severity_counts.keys())
            vals = list(severity_counts.values())
            colors_list = ["#ff1744", "#ff9100", "#ffea00", "#00b0ff", "#94a3b8"]
            sev_colors = [colors_list[i % len(colors_list)] for i in range(len(sevs))]
            ax1.pie(vals, labels=sevs, colors=sev_colors, autopct='%1.1f%%', startangle=90, textprops={'fontsize': 8})
            ax1.set_title("Alert Severity Distribution", fontsize=10, fontweight='bold')

            # Bar Chart
            ax2.bar(sevs, vals, color="#00b0ff", edgecolor="#0091ea", width=0.5)
            ax2.set_title("Alert Frequency", fontsize=10, fontweight='bold')
            ax2.tick_params(axis='both', which='major', labelsize=8)
            ax2.grid(axis='y', linestyle='--', alpha=0.5)

            plt.tight_layout()
            chart_img_path = str(reports_dir / f"temp_chart_{timestamp}.png")
            plt.savefig(chart_img_path, dpi=200)
            plt.close()
            chart_paths.append(chart_img_path)

            story.append(Paragraph("Security Distribution Analysis", heading2_style))
            story.append(Image(chart_img_path, width=480, height=192))
            story.append(Spacer(1, 15))
    except Exception:
        pass  # Fallback if matplotlib errors out

    # 4. AI Executive Summary Content
    story.append(Paragraph("Executive Summary & Actionable Recommendations", heading2_style))

    # Simple clean parsing of markdown generated by AI
    clean_lines = []
    for line in ai_content.split('\n'):
        line = line.strip()
        if not line:
            continue
        if line.startswith('#'):
            clean_lines.append((line.replace('#', '').strip(), 'heading'))
        elif line.startswith('-') or line.startswith('*'):
            clean_lines.append((line[1:].strip(), 'bullet'))
        else:
            clean_lines.append((line, 'text'))

    for content, line_type in clean_lines:
        if line_type == 'heading':
            story.append(Paragraph(
                content,
                ParagraphStyle(
                    'Heading3', parent=styles['Heading3'],
                    textColor=primary_color, fontSize=12, fontName='Helvetica-Bold'
                )
            ))
        elif line_type == 'bullet':
            story.append(Paragraph(f"• {content}", bullet_style))
        else:
            story.append(Paragraph(content, body_style))

    # Build the document
    doc.build(story)

    # Cleanup temporary charts
    for path in chart_paths:
        try:
            os.remove(path)
        except OSError:
            pass

    return pdf_filename
