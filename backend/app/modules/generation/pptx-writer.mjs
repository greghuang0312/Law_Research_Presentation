import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SLIDE_WIDTH = 9_144_000;
const SLIDE_HEIGHT = 6_858_000;
const NOTES_WIDTH = 6_858_000;
const NOTES_HEIGHT = 9_144_000;
const XML_NS = "http://schemas.openxmlformats.org/presentationml/2006/main";
const DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function toPortablePath(value) {
  return value.split(path.sep).join("/");
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildCrc32Table() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? (0xedb88320 ^ (value >>> 1)) >>> 0 : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

const CRC32_TABLE = buildCrc32Table();

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function toBuffer(content) {
  return Buffer.isBuffer(content) ? content : Buffer.from(String(content), "utf8");
}

function createStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const dataBuffer = toBuffer(entry.data);
    const crc = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectoryBuffer = Buffer.concat(centralParts);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(entries.length, 8);
  endOfCentralDirectory.writeUInt16LE(entries.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectoryBuffer.length, 12);
  endOfCentralDirectory.writeUInt32LE(centralDirectoryOffset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectoryBuffer, endOfCentralDirectory]);
}

function textShapeXml({ id, name, x, y, cx, cy, paragraphs }) {
  const body = paragraphs.length > 0 ? paragraphs.join("") : `<a:p><a:endParaRPr lang="en-US" sz="1800"/></a:p>`;
  return [
    `<p:sp>`,
    `<p:nvSpPr>`,
    `<p:cNvPr id="${id}" name="${xmlEscape(name)}"/>`,
    `<p:cNvSpPr txBox="1"/>`,
    `<p:nvPr/>`,
    `</p:nvSpPr>`,
    `<p:spPr>`,
    `<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>`,
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`,
    `</p:spPr>`,
    `<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${body}</p:txBody>`,
    `</p:sp>`,
  ].join("");
}

function bulletParagraphXml(text, size = 2200, bold = false) {
  const boldAttr = bold ? ` b="1"` : "";
  return `<a:p><a:r><a:rPr lang="en-US" sz="${size}"${boldAttr}/><a:t>${xmlEscape(text)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${size}"/></a:p>`;
}

function buildSlideXml(slide) {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:sld xmlns:a="${DRAWING_NS}" xmlns:r="${REL_NS}" xmlns:p="${XML_NS}">`,
    `<p:cSld><p:spTree>`,
    `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`,
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`,
    textShapeXml({
      id: 2,
      name: "Title",
      x: 457200,
      y: 228600,
      cx: 8229600,
      cy: 685800,
      paragraphs: [bulletParagraphXml(slide.title, 2800, true)],
    }),
    textShapeXml({
      id: 3,
      name: "Body",
      x: 685800,
      y: 1219200,
      cx: 7772400,
      cy: 3657600,
      paragraphs: slide.bullets.map((item) => bulletParagraphXml(item, 2200, false)),
    }),
    textShapeXml({
      id: 4,
      name: "Citations",
      x: 685800,
      y: 5943600,
      cx: 7772400,
      cy: 548640,
      paragraphs: [bulletParagraphXml(`Sources: ${slide.citations.join(" ; ")}`, 1600, true)],
    }),
    `</p:spTree></p:cSld>`,
    `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>`,
    `</p:sld>`,
  ].join("");
}

function buildContentTypesXml(slideCount) {
  const slideOverrides = Array.from({ length: slideCount }, (_, index) => {
    const slideNumber = index + 1;
    return `<Override PartName="/ppt/slides/slide${slideNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
  }).join("");

  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`,
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`,
    `<Default Extension="xml" ContentType="application/xml"/>`,
    `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>`,
    `<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>`,
    `<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>`,
    `<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>`,
    `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>`,
    `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`,
    `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>`,
    `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>`,
    `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>`,
    slideOverrides,
    `</Types>`,
  ].join("");
}

function buildRootRelationshipsXml() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>`,
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>`,
    `</Relationships>`,
  ].join("");
}

function buildPresentationXml(slideCount) {
  const slideIds = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 5}"/>`).join("");
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:presentation xmlns:a="${DRAWING_NS}" xmlns:r="${REL_NS}" xmlns:p="${XML_NS}">`,
    `<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>`,
    `<p:sldIdLst>${slideIds}</p:sldIdLst>`,
    `<p:sldSz cx="${SLIDE_WIDTH}" cy="${SLIDE_HEIGHT}"/>`,
    `<p:notesSz cx="${NOTES_WIDTH}" cy="${NOTES_HEIGHT}"/>`,
    `</p:presentation>`,
  ].join("");
}

function buildPresentationRelationshipsXml(slideCount) {
  const slideRelationships = Array.from({ length: slideCount }, (_, index) => {
    const slideNumber = index + 1;
    return `<Relationship Id="rId${index + 5}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideNumber}.xml"/>`;
  }).join("");

  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>`,
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>`,
    `<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>`,
    slideRelationships,
    `</Relationships>`,
  ].join("");
}

function buildSlideRelationshipXml() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`,
    `</Relationships>`,
  ].join("");
}

function buildSlideMasterXml() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:sldMaster xmlns:a="${DRAWING_NS}" xmlns:r="${REL_NS}" xmlns:p="${XML_NS}">`,
    `<p:cSld name="Default Master"><p:spTree>`,
    `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`,
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`,
    `</p:spTree></p:cSld>`,
    `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>`,
    `<p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst>`,
    `<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>`,
    `</p:sldMaster>`,
  ].join("");
}

function buildSlideMasterRelationshipsXml() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>`,
    `</Relationships>`,
  ].join("");
}

function buildSlideLayoutXml() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:sldLayout xmlns:a="${DRAWING_NS}" xmlns:r="${REL_NS}" xmlns:p="${XML_NS}" type="titleAndContent" preserve="1">`,
    `<p:cSld name="Title and Content"><p:spTree>`,
    `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`,
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`,
    `</p:spTree></p:cSld>`,
    `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>`,
    `</p:sldLayout>`,
  ].join("");
}

function buildSlideLayoutRelationshipsXml() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>`,
    `</Relationships>`,
  ].join("");
}

function buildThemeXml() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<a:theme xmlns:a="${DRAWING_NS}" name="Task6 Theme">`,
    `<a:themeElements>`,
    `<a:clrScheme name="Task6 Colors">`,
    `<a:dk1><a:srgbClr val="1F2937"/></a:dk1>`,
    `<a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>`,
    `<a:dk2><a:srgbClr val="111827"/></a:dk2>`,
    `<a:lt2><a:srgbClr val="F3F4F6"/></a:lt2>`,
    `<a:accent1><a:srgbClr val="2563EB"/></a:accent1>`,
    `<a:accent2><a:srgbClr val="0F766E"/></a:accent2>`,
    `<a:accent3><a:srgbClr val="B45309"/></a:accent3>`,
    `<a:accent4><a:srgbClr val="7C3AED"/></a:accent4>`,
    `<a:accent5><a:srgbClr val="DC2626"/></a:accent5>`,
    `<a:accent6><a:srgbClr val="4F46E5"/></a:accent6>`,
    `<a:hlink><a:srgbClr val="2563EB"/></a:hlink>`,
    `<a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>`,
    `</a:clrScheme>`,
    `<a:fontScheme name="Task6 Fonts">`,
    `<a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>`,
    `<a:minorFont><a:latin typeface="Aptos"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>`,
    `</a:fontScheme>`,
    `<a:fmtScheme name="Task6 Formats">`,
    `<a:fillStyleLst><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:fillStyleLst>`,
    `<a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:ln></a:lnStyleLst>`,
    `<a:effectStyleLst><a:effectStyle/></a:effectStyleLst>`,
    `<a:bgFillStyleLst><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:bgFillStyleLst>`,
    `</a:fmtScheme>`,
    `</a:themeElements>`,
    `<a:objectDefaults/>`,
    `<a:extraClrSchemeLst/>`,
    `</a:theme>`,
  ].join("");
}

function buildPresPropsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentationPr xmlns:a="${DRAWING_NS}" xmlns:r="${REL_NS}" xmlns:p="${XML_NS}"><p:extLst/></p:presentationPr>`;
}

function buildViewPropsXml() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:viewPr xmlns:a="${DRAWING_NS}" xmlns:r="${REL_NS}" xmlns:p="${XML_NS}" lastView="sldView">`,
    `<p:normalViewPr showOutlineIcons="0"><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr>`,
    `<p:slideViewPr><p:cSldViewPr snapToGrid="1" snapToObjects="1" showGuides="1"/></p:slideViewPr>`,
    `<p:notesTextViewPr/>`,
    `<p:gridSpacing cx="78028800" cy="78028800"/>`,
    `</p:viewPr>`,
  ].join("");
}

function buildTableStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:tblStyleLst xmlns:a="${DRAWING_NS}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`;
}

function buildCorePropsXml(deck) {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`,
    `<dc:title>${xmlEscape(deck.topic)}</dc:title>`,
    `<dc:creator>Codex</dc:creator>`,
    `<cp:lastModifiedBy>Codex</cp:lastModifiedBy>`,
    `<dcterms:created xsi:type="dcterms:W3CDTF">${xmlEscape(deck.generated_at)}</dcterms:created>`,
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${xmlEscape(deck.generated_at)}</dcterms:modified>`,
    `</cp:coreProperties>`,
  ].join("");
}

function buildAppPropsXml(slideCount) {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">`,
    `<Application>Law Lesson PPT MVP</Application>`,
    `<Slides>${slideCount}</Slides>`,
    `<Notes>0</Notes>`,
    `<PresentationFormat>On-screen Show (4:3)</PresentationFormat>`,
    `</Properties>`,
  ].join("");
}

export function createPptxBuffer(deck) {
  const slideEntries = deck.slides.flatMap((slide, index) => {
    const slideNumber = index + 1;
    return [
      { name: `ppt/slides/slide${slideNumber}.xml`, data: buildSlideXml(slide) },
      { name: `ppt/slides/_rels/slide${slideNumber}.xml.rels`, data: buildSlideRelationshipXml() },
    ];
  });

  return createStoredZip([
    { name: "[Content_Types].xml", data: buildContentTypesXml(deck.slides.length) },
    { name: "_rels/.rels", data: buildRootRelationshipsXml() },
    { name: "docProps/core.xml", data: buildCorePropsXml(deck) },
    { name: "docProps/app.xml", data: buildAppPropsXml(deck.slides.length) },
    { name: "ppt/presentation.xml", data: buildPresentationXml(deck.slides.length) },
    { name: "ppt/_rels/presentation.xml.rels", data: buildPresentationRelationshipsXml(deck.slides.length) },
    { name: "ppt/presProps.xml", data: buildPresPropsXml() },
    { name: "ppt/viewProps.xml", data: buildViewPropsXml() },
    { name: "ppt/tableStyles.xml", data: buildTableStylesXml() },
    { name: "ppt/slideMasters/slideMaster1.xml", data: buildSlideMasterXml() },
    { name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: buildSlideMasterRelationshipsXml() },
    { name: "ppt/slideLayouts/slideLayout1.xml", data: buildSlideLayoutXml() },
    { name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: buildSlideLayoutRelationshipsXml() },
    { name: "ppt/theme/theme1.xml", data: buildThemeXml() },
    ...slideEntries,
  ]);
}

export function writePptxFile({
  rootDir = process.cwd(),
  deck,
  fileName,
}) {
  const outputDirectory = path.join(rootDir, "outputs", "ppt");
  mkdirSync(outputDirectory, { recursive: true });

  const outputPath = path.join(outputDirectory, fileName);
  writeFileSync(outputPath, createPptxBuffer(deck));

  return {
    filePath: outputPath,
    relativePath: toPortablePath(path.relative(rootDir, outputPath)),
  };
}
