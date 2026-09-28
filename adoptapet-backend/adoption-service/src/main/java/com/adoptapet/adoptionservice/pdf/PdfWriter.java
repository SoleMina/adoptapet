package com.adoptapet.adoptionservice.pdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

/**
 * Small layout helper on top of PDFBox shared by the adoption act and the general report.
 * It keeps a cursor (y) and adds pages automatically.
 */
public class PdfWriter implements AutoCloseable {

	private static final float MARGIN = 50;
	private static final float PAGE_WIDTH = PDRectangle.LETTER.getWidth();
	private static final float PAGE_HEIGHT = PDRectangle.LETTER.getHeight();
	public static final float CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

	private static final int[] BRAND = { 31, 122, 109 };
	private static final int[] DARK = { 23, 32, 42 };
	private static final int[] MUTED = { 100, 116, 139 };
	private static final int[] TEXT = { 51, 65, 85 };
	private static final int[] LIGHT = { 248, 250, 252 };
	private static final int[] LINE = { 219, 228, 236 };

	private final PDDocument document = new PDDocument();
	private final PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
	private final PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
	private final String runningTitle;
	private PDPageContentStream content;
	private float y;

	public PdfWriter(String runningTitle) throws IOException {
		this.runningTitle = runningTitle;
		newPage(false);
	}

	public void header(String title, String subtitle) throws IOException {
		fill(BRAND);
		content.addRect(MARGIN, y - 40, 42, 42);
		content.fill();
		fill(new int[] { 255, 255, 255 });
		text("AP", MARGIN + 10, y - 27, bold, 16);

		fill(DARK);
		text("AdoptaPet", MARGIN + 54, y - 8, bold, 14);
		fill(MUTED);
		text(runningTitle, MARGIN + 54, y - 25, regular, 10);

		fill(DARK);
		text(title, MARGIN, y - 72, bold, 18);
		fill(MUTED);
		text(subtitle, MARGIN, y - 89, regular, 10);

		line(y - 105, BRAND, 1.2f);
		y -= 128;
	}

	public void section(String title) throws IOException {
		ensureSpace(42);
		fill(BRAND);
		text(title.toUpperCase(), MARGIN, y, bold, 11);
		y -= 14;
		line(y, LINE, 0.6f);
		y -= 12;
	}

	/** Label on the left, value wrapped on the right. */
	public void field(String label, Object value) throws IOException {
		List<String> lines = wrap(String.valueOf(value == null ? "" : value), regular, 9.5f, CONTENT_WIDTH - 170);
		float height = Math.max(24, 12 + lines.size() * 12);
		ensureSpace(height + 4);

		fill(LIGHT);
		content.addRect(MARGIN, y - height + 7, CONTENT_WIDTH, height);
		content.fill();
		fill(MUTED);
		text(label + ":", MARGIN + 10, y - 8, bold, 9.5f);
		fill(TEXT);
		float lineY = y - 8;
		for (String line : lines) {
			text(line, MARGIN + 160, lineY, regular, 9.5f);
			lineY -= 12;
		}
		y -= height + 4;
	}

	public void paragraph(String value) throws IOException {
		List<String> lines = wrap(value, regular, 9.8f, CONTENT_WIDTH - 24);
		float height = 16 + lines.size() * 13;
		ensureSpace(height + 8);
		fill(new int[] { 240, 253, 250 });
		content.addRect(MARGIN, y - height + 8, CONTENT_WIDTH, height);
		content.fill();
		fill(TEXT);
		float lineY = y - 6;
		for (String line : lines) {
			text(line, MARGIN + 12, lineY, regular, 9.8f);
			lineY -= 13;
		}
		y -= height + 12;
	}

	/** Row of equal cards with a big number, used at the top of the report. */
	public void metrics(String[] labels, long[] values) throws IOException {
		ensureSpace(80);
		float gap = 8;
		float width = (CONTENT_WIDTH - gap * (labels.length - 1)) / labels.length;
		for (int i = 0; i < labels.length; i++) {
			float x = MARGIN + i * (width + gap);
			fill(LIGHT);
			content.addRect(x, y - 52, width, 60);
			content.fill();
			fill(MUTED);
			text(labels[i], x + 10, y - 10, regular, 8.5f);
			fill(DARK);
			text(String.valueOf(values[i]), x + 10, y - 34, bold, 17);
		}
		y -= 74;
	}

	/** Simple table; columnX are offsets from the left margin. */
	public void tableHeader(String[] columns, float[] columnX) throws IOException {
		ensureSpace(45);
		fill(DARK);
		content.addRect(MARGIN, y - 18, CONTENT_WIDTH, 24);
		content.fill();
		fill(new int[] { 255, 255, 255 });
		for (int i = 0; i < columns.length; i++) {
			text(columns[i], MARGIN + columnX[i] + 6, y - 9, bold, 8);
		}
		y -= 28;
	}

	public void tableRow(String[] values, float[] columnX, int[] maxChars) throws IOException {
		ensureSpace(24);
		fill(TEXT);
		for (int i = 0; i < values.length; i++) {
			text(limit(values[i], maxChars[i]), MARGIN + columnX[i] + 6, y - 6, regular, 8);
		}
		line(y - 13, LINE, 0.5f);
		y -= 22;
	}

	public void signatures(String left, String right) throws IOException {
		ensureSpace(90);
		y -= 40;
		float width = 190;
		float leftX = MARGIN + 18;
		float rightX = PAGE_WIDTH - MARGIN - width - 18;
		stroke(TEXT);
		content.setLineWidth(0.8f);
		content.moveTo(leftX, y);
		content.lineTo(leftX + width, y);
		content.moveTo(rightX, y);
		content.lineTo(rightX + width, y);
		content.stroke();
		y -= 15;
		fill(TEXT);
		text(left, leftX, y, regular, 9.5f);
		text(right, rightX, y, regular, 9.5f);
	}

	public void space(float points) {
		y -= points;
	}

	public byte[] toBytes() throws IOException {
		content.close();
		content = null;
		ByteArrayOutputStream output = new ByteArrayOutputStream();
		document.save(output);
		return output.toByteArray();
	}

	@Override
	public void close() throws IOException {
		if (content != null) {
			content.close();
		}
		document.close();
	}

	// ----- internals -----

	private void ensureSpace(float height) throws IOException {
		if (y - height < MARGIN) {
			newPage(true);
		}
	}

	private void newPage(boolean continuation) throws IOException {
		if (content != null) {
			content.close();
		}
		PDPage page = new PDPage(PDRectangle.LETTER);
		document.addPage(page);
		content = new PDPageContentStream(document, page);
		y = PAGE_HEIGHT - MARGIN;
		if (continuation) {
			fill(BRAND);
			text("AdoptaPet", MARGIN, y, bold, 11);
			fill(MUTED);
			text(runningTitle, MARGIN + 80, y, regular, 9.5f);
			y -= 16;
			line(y, LINE, 0.6f);
			y -= 22;
		}
	}

	private void line(float atY, int[] color, float width) throws IOException {
		stroke(color);
		content.setLineWidth(width);
		content.moveTo(MARGIN, atY);
		content.lineTo(PAGE_WIDTH - MARGIN, atY);
		content.stroke();
	}

	private void text(String value, float x, float atY, PDFont font, float size) throws IOException {
		content.beginText();
		content.setFont(font, size);
		content.newLineAtOffset(x, atY);
		content.showText(sanitize(value));
		content.endText();
	}

	private void fill(int[] rgb) throws IOException {
		content.setNonStrokingColor(rgb[0] / 255f, rgb[1] / 255f, rgb[2] / 255f);
	}

	private void stroke(int[] rgb) throws IOException {
		content.setStrokingColor(rgb[0] / 255f, rgb[1] / 255f, rgb[2] / 255f);
	}

	private List<String> wrap(String value, PDFont font, float size, float maxWidth) throws IOException {
		List<String> lines = new ArrayList<>();
		StringBuilder current = new StringBuilder();
		for (String word : sanitize(value).split(" ")) {
			String candidate = current.isEmpty() ? word : current + " " + word;
			if (font.getStringWidth(candidate) / 1000 * size > maxWidth && !current.isEmpty()) {
				lines.add(current.toString());
				current = new StringBuilder(word);
			} else {
				current = new StringBuilder(candidate);
			}
		}
		lines.add(current.toString());
		return lines;
	}

	private String limit(String value, int maxChars) {
		String safe = value == null ? "" : value;
		return safe.length() <= maxChars ? safe : safe.substring(0, maxChars - 1) + ".";
	}

	/** Standard PDF fonts only support Latin-1: drop line breaks and anything they cannot draw (e.g. emoji). */
	private String sanitize(String value) {
		if (value == null) {
			return "";
		}
		StringBuilder safe = new StringBuilder();
		value.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ').codePoints()
				.filter(c -> (c >= 32 && c <= 126) || (c >= 160 && c <= 255))
				.forEach(safe::appendCodePoint);
		return safe.toString();
	}
}
