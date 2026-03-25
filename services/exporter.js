import fs from 'fs'
import PDFDocument from 'pdfkit'
import { Document, Packer, Paragraph, TextRun } from 'docx'

export async function exportAsTxt(filePath, content) {
  await fs.promises.writeFile(filePath, content, 'utf-8')
}

export async function exportAsPdf(filePath, content) {
  const doc = new PDFDocument()
  const stream = fs.createWriteStream(filePath)
  doc.pipe(stream)
  doc.fontSize(12).text(content, { align: 'left' })
  doc.end()
  await new Promise(res => stream.on('finish', res))
}

export async function exportAsDocx(filePath, content) {
  const paragraphs = content.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line })] }))
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const buffer = await Packer.toBuffer(doc)
  await fs.promises.writeFile(filePath, buffer)
}
