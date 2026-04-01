import { useEffect, useMemo, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import TranslateText, { TranslateLanguage } from '@react-native-ml-kit/translate-text'

const GOOGLE_AI_MODEL = 'gemini-2.5-flash'
const TOOLTIP_WIDTH = 280
const TOOLTIP_GAP = 10
const TOOLTIP_SCREEN_MARGIN = 14
const TOOLTIP_MIN_TOP = 88
const STORAGE_LIBRARY_KEY = 'bookapp.library.v2'
const STORAGE_LAST_BOOK_ID_KEY = 'bookapp.lastBookId.v2'
const STORAGE_THEME_MODE_KEY = 'bookapp.themeMode.v1'
const STORAGE_FONT_SCALE_KEY = 'bookapp.fontScale.v1'
const SAMPLE_BOOK_ID = 'sample-book'
const FONT_SCALE_OPTIONS = {
  sm: { body: 15, lineHeight: 24, subhead: 16, subheadLineHeight: 25, label: 'A' },
  md: { body: 17, lineHeight: 27, subhead: 18, subheadLineHeight: 28, label: 'Aa' },
  lg: { body: 20, lineHeight: 31, subhead: 21, subheadLineHeight: 32, label: 'AA' },
}
const LIGHT_THEME = {
  background: '#f4ede2',
  surface: '#fff7ef',
  surfaceStrong: '#fff9f3',
  border: '#e1d1bf',
  borderSoft: '#efe2d3',
  text: '#2f1b0f',
  textMuted: '#6f5b49',
  textSoft: '#8b6649',
  textInverted: '#fffaf5',
  accent: '#7b4a31',
  accentMuted: '#eadfce',
  accentText: '#5b4030',
  success: '#48613a',
  error: '#b33a2b',
  dangerSurface: '#f1ddd3',
  dangerText: '#8d3d2f',
  coverFallback: '#dbc8b1',
  coverFallbackText: '#6b4b34',
}
const DARK_THEME = {
  background: '#171311',
  surface: '#231c18',
  surfaceStrong: '#2b221d',
  border: '#3c3028',
  borderSoft: '#4a3a30',
  text: '#f5eadc',
  textMuted: '#c8b7a6',
  textSoft: '#a98e78',
  textInverted: '#171311',
  accent: '#d7a36e',
  accentMuted: '#3a2e27',
  accentText: '#f5eadc',
  success: '#8eb57d',
  error: '#ff9d8f',
  dangerSurface: '#4a2c28',
  dangerText: '#ffb5ab',
  coverFallback: '#4f3d31',
  coverFallbackText: '#f0ddca',
}
const SAMPLE_READING_TEXT = `On quiet mornings, Emma liked to sit near the window and read one chapter before the city fully woke up. The soft light came through the curtains, the coffee slowly cooled beside her, and every paragraph felt like an open door to another life.

She loved the way stories made ordinary moments feel larger. A simple train ride turned into an adventure. A short conversation opened up a secret. A rainy afternoon became the beginning of a memory worth keeping.

One day, while reading in English, she began to look up unfamiliar expressions instead of skipping them. Some sentences seemed simple at first, but then a phrasal verb would show up and change the whole meaning. She wrote them down, read them out loud, and went over them again until they started to feel natural.

That small habit changed the way she learned. Reading was no longer only about getting through a page. It became a slow and personal dialogue with language, one phrase at a time. When a sentence was difficult, she would slow down, break it down, and figure out why it worked.

The room stayed silent except for the turning of pages and the distant sound of traffic outside. Emma underlined expressions she wanted to come back to, circled verbs she did not want to mix up, and smiled whenever a sentence came together without translation.

Some days she moved quickly, almost flying through the lines. On other days she paused after every few words, letting them sink in before she carried on. If a paragraph did not make sense right away, she would go back, read it over, and try to work out the meaning from context.

As the weeks went by, she started to pick up patterns she had missed before. She could point out when a character was showing off, when two friends had fallen out, or when someone was trying to cheer another person up. Little by little, the language stopped feeling far away and began to open up to her.`
const SAMPLE_BOOK = {
  id: SAMPLE_BOOK_ID,
  title: 'Sample text',
  sourceName: 'Built-in sample',
  bookPath: '',
  coverDataUri: '',
  chapterCount: 1,
  currentChapterIndex: 0,
  currentPageIndex: 0,
  lastScrollY: 0,
  isSample: true,
}

const SAMPLE_CHAPTERS = [{ title: 'Sample text', text: SAMPLE_READING_TEXT, blocks: [{ type: 'text', text: SAMPLE_READING_TEXT }] }]
const PHRASAL_VERBS = new Set([
  'break down',
  'carry on',
  'cheer up',
  'come back',
  'come through',
  'fall out',
  'figure out',
  'get through',
  'go back',
  'go by',
  'go over',
  'look up',
  'mix up',
  'open up',
  'pick up',
  'point out',
  'read over',
  'show off',
  'show up',
  'sink in',
  'slow down',
  'turn into',
  'wake up',
  'work out',
  'write down',
])
const IRREGULAR_VERB_LEMMAS = {
  began: 'begin',
  begun: 'begin',
  broke: 'break',
  broken: 'break',
  came: 'come',
  carried: 'carry',
  cheered: 'cheer',
  did: 'do',
  done: 'do',
  fallen: 'fall',
  felt: 'feel',
  flew: 'fly',
  flown: 'fly',
  gave: 'give',
  given: 'give',
  went: 'go',
  gone: 'go',
  got: 'get',
  gotten: 'get',
  kept: 'keep',
  knew: 'know',
  known: 'know',
  made: 'make',
  read: 'read',
  rode: 'ride',
  ridden: 'ride',
  ran: 'run',
  run: 'run',
  sank: 'sink',
  sunk: 'sink',
  showed: 'show',
  shown: 'show',
  slowed: 'slow',
  spoke: 'speak',
  spoken: 'speak',
  took: 'take',
  taken: 'take',
  thought: 'think',
  turned: 'turn',
  woke: 'wake',
  woken: 'wake',
  wrote: 'write',
  written: 'write',
}
const PARTICLE_HINTS = {
  up: 'completion or activation',
  out: 'completion or release',
  off: 'separation or stopping',
  on: 'continuation or progress',
  in: 'entry or inclusion',
  into: 'change into something',
  over: 'review or repetition',
  through: 'from start to finish',
  back: 'return or reversal',
  down: 'reduction or breakdown',
}

const translationCache = new Map()
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  trimValues: true,
})

function asArray(value) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function normalizeWhitespace(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ *\n */g, '\n')
    .trim()
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function normalizeDecoratedHeading(text) {
  let normalized = decodeHtmlEntities(
    String(text || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?small>/gi, '')
      .replace(/<\/?b>/gi, '')
      .replace(/<\/?i>/gi, '')
      .replace(/<\/?em>/gi, '')
      .replace(/<\/?strong>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/ /g, ' '),
  )

  normalized = normalizeWhitespace(normalized)

  for (let index = 0; index < 8; index += 1) {
    const collapsed = normalized.replace(/\b([A-Z])\s+([A-Z]{2,})\b/g, '$1$2')
    if (collapsed === normalized) {
      break
    }
    normalized = collapsed
  }

  return normalized
}

function isLikelySubhead(paragraph) {
  const normalized = normalizeWhitespace(String(paragraph || ''))

  if (!normalized || normalized.length > 90) {
    return false
  }

  if (/[.!?;:]["']?$/.test(normalized)) {
    return false
  }

  const words = normalized.split(' ').filter(Boolean)
  if (words.length < 2 || words.length > 12) {
    return false
  }

  const lettersOnly = normalized.replace(/[^A-Za-z]/g, '')
  if (lettersOnly.length < 8) {
    return false
  }

  const uppercaseLetters = lettersOnly.replace(/[^A-Z]/g, '').length
  const uppercaseRatio = uppercaseLetters / lettersOnly.length

  return uppercaseRatio >= 0.85
}

function stripHtmlToText(html) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<sup[^>]*>\s*(?:<a[^>]*>)?\s*([^<\s]+)\s*(?:<\/a>)?\s*<\/sup>/gi, ' [[REF:$1]] ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li|blockquote|tr)>/gi, '\n')
        .replace(/<li\b[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, ' '),
    ),
  )
}

function guessMediaTypeFromPath(filePath) {
  const normalized = String(filePath || '').toLowerCase()

  if (normalized.endsWith('.png')) {
    return 'image/png'
  }
  if (normalized.endsWith('.gif')) {
    return 'image/gif'
  }
  if (normalized.endsWith('.webp')) {
    return 'image/webp'
  }
  if (normalized.endsWith('.svg')) {
    return 'image/svg+xml'
  }

  return 'image/jpeg'
}

async function extractBlocksFromHtml({ html, chapterPath, zip, mediaTypeByPath }) {
  const sanitizedHtml = html
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')

  const blocks = []
  const imageRegex = /<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi
  let lastIndex = 0
  let match

  function pushTextFragment(fragmentHtml) {
    const normalizedFragment = fragmentHtml
      .replace(/<p[^>]*class=["'][^"']*subhead[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi, (_, innerHtml) => `\n\n${normalizeDecoratedHeading(innerHtml)}\n\n` )

    splitIntoParagraphs(stripHtmlToText(normalizedFragment)).forEach((paragraph) => {
      if (!paragraph) {
        return
      }

      const subheadMatch = paragraph.match(/^\[\[SUBHEAD:(.*)\]\]$/)
      if (subheadMatch) {
        blocks.push({ type: 'subhead', text: subheadMatch[1].trim() })
        return
      }

      if (isLikelySubhead(paragraph)) {
        blocks.push({ type: 'subhead', text: paragraph })
        return
      }

      blocks.push({ type: 'text', text: paragraph })
    })
  }

  while ((match = imageRegex.exec(sanitizedHtml)) !== null) {
    const textFragment = sanitizedHtml.slice(lastIndex, match.index)
    pushTextFragment(textFragment)

    const imagePath = stripFragment(resolveRelativePath(chapterPath, match[1]))
    const imageFile = zip.file(imagePath)

    if (imageFile) {
      const imageBase64 = await imageFile.async('base64')
      blocks.push({
        type: 'image',
        uri: `data:${mediaTypeByPath.get(imagePath) || guessMediaTypeFromPath(imagePath)};base64,${imageBase64}`,
      })
    }

    lastIndex = imageRegex.lastIndex
  }

  const trailingFragment = sanitizedHtml.slice(lastIndex)
  pushTextFragment(trailingFragment)

  return blocks.length > 0 ? blocks : [{ type: 'text', text: normalizeWhitespace(stripHtmlToText(html)) }]
}

function splitIntoChapterChunks(text, maxChars = 9000) {
  const paragraphs = normalizeWhitespace(text).split('\n\n').filter(Boolean)
  const chapters = []
  let current = ''

  paragraphs.forEach((paragraph) => {
    const next = current ? `${current}\n\n${paragraph}` : paragraph
    if (next.length > maxChars && current) {
      chapters.push(current)
      current = paragraph
      return
    }
    current = next
  })

  if (current) {
    chapters.push(current)
  }

  return chapters.length > 0 ? chapters : [normalizeWhitespace(text)]
}

function splitIntoParagraphs(text) {
  return normalizeWhitespace(text).split('\n\n').map((paragraph) => paragraph.trim()).filter(Boolean)
}

function getChapterHeading(text) {
  const paragraphs = splitIntoParagraphs(text)

  for (const paragraph of paragraphs.slice(0, 4)) {
    const line = paragraph.split('\n')[0]?.trim() ?? ''
    if (!line) {
      continue
    }

    if (line.length <= 80 && /chapter|prologue|epilogue|foreword|preface|introduction|afterword/i.test(line)) {
      return line
    }
  }

  return ''
}

function stripLeadingChapterHeading(text, heading) {
  if (!heading) {
    return text
  }

  const trimmed = text.trimStart()
  if (!trimmed.toLowerCase().startsWith(heading.toLowerCase())) {
    return text
  }

  return trimmed.slice(heading.length).replace(/^\s+/, '')
}

function stripRepeatedChapterTitle(text, title) {
  const trimmed = String(text || '').trimStart()
  const normalizedTitle = normalizeWhitespace(String(title || ''))

  if (!normalizedTitle) {
    return trimmed
  }

  if (trimmed.toLowerCase().startsWith(normalizedTitle.toLowerCase())) {
    return trimmed.slice(normalizedTitle.length).replace(/^\s+/, '')
  }

  const firstLine = trimmed.split('\n')[0]?.trim() ?? ''
  if (firstLine && firstLine.toLowerCase() === normalizedTitle.toLowerCase()) {
    return trimmed.slice(firstLine.length).replace(/^\s+/, '')
  }

  return trimmed
}

function splitChapterIntoPages(text, maxChars = 3200) {
  const paragraphs = splitIntoParagraphs(text)
  const pages = []
  let current = ''

  paragraphs.forEach((paragraph) => {
    const next = current ? `${current}\n\n${paragraph}` : paragraph
    if (next.length > maxChars && current) {
      pages.push(current)
      current = paragraph
      return
    }
    current = next
  })

  if (current) {
    pages.push(current)
  }

  return pages.length > 0 ? pages : [normalizeWhitespace(text)]
}

function splitChapterEntryIntoPages(chapterEntry, maxUnits = 3200, imageUnits = 1200) {
  const sourceBlocks = chapterEntry?.blocks?.length
    ? chapterEntry.blocks
    : [{ type: 'text', text: chapterEntry?.text || '' }]

  const pages = []
  let currentBlocks = []
  let currentUnits = 0

  sourceBlocks.forEach((block) => {
    const blockUnits = block.type === 'image' ? imageUnits : Math.max(1, (block.text || '').length)

    if (currentBlocks.length > 0 && currentUnits + blockUnits > maxUnits) {
      pages.push(currentBlocks)
      currentBlocks = [block]
      currentUnits = blockUnits
      return
    }

    currentBlocks.push(block)
    currentUnits += blockUnits
  })

  if (currentBlocks.length > 0) {
    pages.push(currentBlocks)
  }

  return pages.length > 0 ? pages : [[{ type: 'text', text: chapterEntry?.text || '' }]]
}

function getDirectoryPath(path) {
  const normalized = path.replace(/\\/g, '/')
  const lastSlash = normalized.lastIndexOf('/')
  return lastSlash === -1 ? '' : normalized.slice(0, lastSlash + 1)
}

function resolveRelativePath(basePath, relativePath) {
  const baseParts = getDirectoryPath(basePath).split('/').filter(Boolean)
  const relativeParts = relativePath.split('/').filter(Boolean)

  if (relativePath.startsWith('/')) {
    return relativeParts.join('/')
  }

  relativeParts.forEach((part) => {
    if (part === '.') {
      return
    }

    if (part === '..') {
      baseParts.pop()
      return
    }

    baseParts.push(part)
  })

  return baseParts.join('/')
}

function stripFragment(path) {
  return String(path || '').split('#')[0]
}

function normalizeBookPath(path) {
  try {
    return decodeURIComponent(String(path || ''))
      .replace(/\\/g, '/')
      .replace(/^\.\//, '')
      .toLowerCase()
  } catch {
    return String(path || '')
      .replace(/\\/g, '/')
      .replace(/^\.\//, '')
      .toLowerCase()
  }
}

function getPathTail(path) {
  const normalized = normalizeBookPath(path)
  const segments = normalized.split('/').filter(Boolean)
  return segments.slice(-2).join('/') || normalized
}

function getTocEntriesFromNcx(ncx) {
  return asArray(ncx?.ncx?.navMap?.navPoint)
    .map((navPoint) => ({
      href: navPoint?.content?.src ?? '',
      label: String(navPoint?.navLabel?.text ?? '').trim(),
    }))
    .filter((entry) => entry.href)
}

function findTocNavNode(node) {
  if (!node || typeof node !== 'object') {
    return null
  }

  const epubType = String(node['epub:type'] ?? node.type ?? node.role ?? '').toLowerCase()
  if (epubType.includes('toc')) {
    return node
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const found = findTocNavNode(entry)
        if (found) {
          return found
        }
      }
      continue
    }

    const found = findTocNavNode(value)
    if (found) {
      return found
    }
  }

  return null
}

function getDirectEntryFromListItem(listItem) {
  if (!listItem || typeof listItem !== 'object') {
    return null
  }

  if (typeof listItem.a?.href === 'string') {
    return {
      href: listItem.a.href,
      label: typeof listItem.a['#text'] === 'string' ? listItem.a['#text'].trim() : '',
    }
  }

  const anchors = asArray(listItem.a)
  const firstAnchor = anchors.find((anchor) => typeof anchor?.href === 'string')
  if (!firstAnchor) {
    return null
  }

  return {
    href: firstAnchor.href,
    label: typeof firstAnchor['#text'] === 'string' ? firstAnchor['#text'].trim() : '',
  }
}

function getTocEntriesFromNavDocument(navHtml) {
  try {
    const parsed = xmlParser.parse(navHtml)
    const tocNav = findTocNavNode(parsed)
    const listItems = asArray(tocNav?.ol?.li)
    const entries = listItems.map(getDirectEntryFromListItem).filter(Boolean)

    if (entries.length > 0) {
      return entries
    }
  } catch {}

  const hrefMatches = [...navHtml.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi)]
  return hrefMatches
    .map((match) => ({
      href: match[1],
      label: String(match[2] || '').replace(/<[^>]+>/g, '').trim(),
    }))
    .filter((entry) => entry.href)
}

async function getEpubTocEntries({ opf, opfPath, manifestMap, zip }) {
  const spineTocId = opf?.spine?.toc
  const ncxItem = spineTocId ? manifestMap.get(spineTocId) : null

  if (ncxItem?.href) {
    const ncxPath = resolveRelativePath(opfPath, ncxItem.href)
    const ncxFile = zip.file(ncxPath)

    if (ncxFile) {
      const ncxXml = await ncxFile.async('string')
      const tocEntries = getTocEntriesFromNcx(xmlParser.parse(ncxXml))
      if (tocEntries.length > 0) {
        return tocEntries.map((entry) => ({
          href: stripFragment(resolveRelativePath(ncxPath, entry.href)),
          label: entry.label,
        }))
      }
    }
  }

  const navItem = [...manifestMap.values()].find((item) => String(item?.properties ?? '').includes('nav'))
  if (navItem?.href) {
    const navPath = resolveRelativePath(opfPath, navItem.href)
    const navFile = zip.file(navPath)

    if (navFile) {
      const navHtml = await navFile.async('string')
      const tocEntries = getTocEntriesFromNavDocument(navHtml)
      if (tocEntries.length > 0) {
        return tocEntries.map((entry) => ({
          href: stripFragment(resolveRelativePath(navPath, entry.href)),
          label: entry.label,
        }))
      }
    }
  }

  return []
}

function findDocumentIndexForTocPath(spineDocuments, tocPath) {
  const normalizedTocPath = normalizeBookPath(tocPath)
  const tocTail = getPathTail(tocPath)

  const exactIndex = spineDocuments.findIndex((document) => normalizeBookPath(document.path) === normalizedTocPath)
  if (exactIndex >= 0) {
    return exactIndex
  }

  const suffixIndex = spineDocuments.findIndex((document) => normalizeBookPath(document.path).endsWith(normalizedTocPath))
  if (suffixIndex >= 0) {
    return suffixIndex
  }

  return spineDocuments.findIndex((document) => getPathTail(document.path) === tocTail)
}

function buildChaptersFromDocuments(spineDocuments, tocEntries) {
  const documentsWithText = spineDocuments.filter((document) => document.text || document.blocks?.length)

  if (documentsWithText.length === 0) {
    return []
  }

  const indexedEntries = tocEntries
    .map((entry) => ({
      ...entry,
      index: findDocumentIndexForTocPath(documentsWithText, entry.href),
    }))
    .filter((entry) => entry.index >= 0)

  const uniqueEntries = indexedEntries.filter(
    (entry, entryIndex) => indexedEntries.findIndex((candidate) => candidate.index === entry.index) === entryIndex,
  )

  if (uniqueEntries.length <= 1) {
    return documentsWithText
      .map((document, index) => ({
        title: `Chapter ${index + 1}`,
        text: document.text,
        blocks: document.blocks || [{ type: 'text', text: document.text }],
      }))
      .filter((entry) => entry.text)
  }

  const sortedEntries = uniqueEntries.sort((left, right) => left.index - right.index)
  const sliceEntries = sortedEntries[0].index === 0
    ? sortedEntries
    : [{ href: documentsWithText[0].path, label: '', index: 0 }, ...sortedEntries]

  return sliceEntries
    .map((entry, index) => {
      const endIndex = sliceEntries[index + 1]?.index ?? documentsWithText.length
      const combinedText = normalizeWhitespace(
        documentsWithText
          .slice(entry.index, endIndex)
          .map((document) => document.text)
          .filter(Boolean)
          .join('\n\n'),
      )

      if (!combinedText) {
        return null
      }

      return {
        title: entry.label || `Chapter ${index + 1}`,
        text: combinedText,
        blocks: documentsWithText
          .slice(entry.index, endIndex)
          .flatMap((document) => document.blocks || [{ type: 'text', text: document.text }]),
      }
    })
    .filter(Boolean)
}

function getMetadataTitle(opf) {
  const metadata = opf?.metadata ?? {}
  const titleNode = metadata.title

  if (typeof titleNode === 'string') {
    return titleNode.trim()
  }

  if (Array.isArray(titleNode)) {
    const firstTitle = titleNode.find((entry) => typeof entry === 'string' || typeof entry?.['#text'] === 'string')
    if (typeof firstTitle === 'string') {
      return firstTitle.trim()
    }
    if (firstTitle?.['#text']) {
      return String(firstTitle['#text']).trim()
    }
  }

  return ''
}

function getCoverItemId(opf) {
  const metadata = asArray(opf?.metadata?.meta)
  const namedCover = metadata.find((entry) => entry?.name === 'cover' && entry?.content)
  return namedCover?.content ?? ''
}

async function extractBookFromEpub(uri) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const zip = await JSZip.loadAsync(base64, { base64: true })
  const containerFile = zip.file('META-INF/container.xml')

  if (!containerFile) {
    throw new Error('Invalid EPUB: missing META-INF/container.xml.')
  }

  const containerXml = await containerFile.async('string')
  const container = xmlParser.parse(containerXml)
  const rootfile = asArray(container?.container?.rootfiles?.rootfile)[0]
  const opfPath = rootfile?.['full-path']

  if (!opfPath) {
    throw new Error('Invalid EPUB: missing package document.')
  }

  const opfFile = zip.file(opfPath)

  if (!opfFile) {
    throw new Error('Invalid EPUB: package document not found.')
  }

  const opfXml = await opfFile.async('string')
  const opf = xmlParser.parse(opfXml)?.package
  const manifestItems = asArray(opf?.manifest?.item)
  const spineItems = asArray(opf?.spine?.itemref)
  const manifestMap = new Map(manifestItems.map((item) => [item.id, item]))
  const mediaTypeByPath = new Map(
    manifestItems
      .filter((item) => item?.href)
      .map((item) => [resolveRelativePath(opfPath, item.href), item['media-type'] || '']),
  )
  const title = getMetadataTitle(opf)
  const coverItemId = getCoverItemId(opf)
  let coverDataUri = ''

  if (coverItemId) {
    const coverItem = manifestMap.get(coverItemId)
    if (coverItem?.href) {
      const coverPath = resolveRelativePath(opfPath, coverItem.href)
      const coverFile = zip.file(coverPath)
      if (coverFile) {
        const coverBase64 = await coverFile.async('base64')
        const mediaType = coverItem['media-type'] || 'image/jpeg'
        coverDataUri = `data:${mediaType};base64,${coverBase64}`
      }
    }
  }

  const spineDocuments = []

  for (const itemref of spineItems) {
    const manifestItem = manifestMap.get(itemref.idref)

    if (!manifestItem?.href) {
      continue
    }

    const mediaType = String(manifestItem['media-type'] ?? '').toLowerCase()
    if (!mediaType.includes('html') && !mediaType.includes('xhtml')) {
      continue
    }

    const chapterPath = resolveRelativePath(opfPath, manifestItem.href)
    const chapterFile = zip.file(chapterPath)

    if (!chapterFile) {
      continue
    }

    const chapterHtml = await chapterFile.async('string')
    const chapterBlocks = await extractBlocksFromHtml({
      html: chapterHtml,
      chapterPath,
      zip,
      mediaTypeByPath,
    })
    const chapterText = normalizeWhitespace(
      chapterBlocks
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n\n'),
    )

    spineDocuments.push({
      path: stripFragment(chapterPath),
      text: chapterText,
      blocks: chapterBlocks,
    })
  }

  const tocEntries = await getEpubTocEntries({
    opf,
    opfPath,
    manifestMap,
    zip,
  })
  const chapterEntries = buildChaptersFromDocuments(spineDocuments, tocEntries)
  const chapters = chapterEntries.map((entry) => entry.text)

  if (chapters.length === 0) {
    throw new Error('This EPUB did not contain readable text content.')
  }

  return {
    chapters,
    chapterEntries,
    title: title || 'Imported EPUB',
    coverDataUri,
  }
}

async function ensureBooksDirectory() {
  const booksDir = `${FileSystem.documentDirectory}books`
  const info = await FileSystem.getInfoAsync(booksDir)

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(booksDir, { intermediates: true })
  }

  return booksDir
}

function getWordValue(token) {
  return token.replace(/[^A-Za-z'-]/g, '')
}

function normalizeWord(token) {
  return getWordValue(token).toLowerCase()
}

function lemmatizeVerb(token) {
  const normalized = normalizeWord(token)

  if (!normalized) {
    return ''
  }

  if (IRREGULAR_VERB_LEMMAS[normalized]) {
    return IRREGULAR_VERB_LEMMAS[normalized]
  }

  if (normalized.endsWith('ies') && normalized.length > 4) {
    return `${normalized.slice(0, -3)}y`
  }

  if (normalized.endsWith('ied') && normalized.length > 4) {
    return `${normalized.slice(0, -3)}y`
  }

  if (normalized.endsWith('ing') && normalized.length > 5) {
    const stem = normalized.slice(0, -3)
    if (stem.endsWith(stem.at(-1) ?? '') && !stem.endsWith('ss')) {
      return stem.slice(0, -1)
    }
    if (stem.endsWith('k') || stem.endsWith('v')) {
      return `${stem}e`
    }
    return stem
  }

  if (normalized.endsWith('ed') && normalized.length > 4) {
    const stem = normalized.slice(0, -2)
    if (stem.endsWith(stem.at(-1) ?? '') && !stem.endsWith('ss')) {
      return stem.slice(0, -1)
    }
    if (stem.endsWith('v') || stem.endsWith('at') || stem.endsWith('iz')) {
      return `${stem}e`
    }
    return stem
  }

  if (normalized.endsWith('es') && normalized.length > 4) {
    return normalized.slice(0, -2)
  }

  if (normalized.endsWith('s') && normalized.length > 3 && !normalized.endsWith('ss')) {
    return normalized.slice(0, -1)
  }

  return normalized
}

function buildContextSnippet(sentence, wordIndex, selectedWordCount = 1, radius = 2) {
  const sentenceTokens = sentence.split(/(\s+)/)
  const words = []

  sentenceTokens.forEach((token, tokenIndex) => {
    if (!getWordValue(token)) {
      return
    }

    words.push({ tokenIndex })
  })

  if (words.length === 0) {
    return sentence.trim()
  }

  const startWordIndex = Math.max(0, wordIndex - radius)
  const endWordIndex = Math.min(words.length - 1, wordIndex + selectedWordCount - 1 + radius)
  const startTokenIndex = words[startWordIndex].tokenIndex
  const endTokenIndex = words[endWordIndex].tokenIndex

  return sentenceTokens.slice(startTokenIndex, endTokenIndex + 1).join('').trim()
}

function getSentenceWords(text) {
  return text.match(/[A-Za-zÀ-ÿ'-]+/g) ?? []
}

function buildCacheKey({ mode, sentence, selectionText, selectionType, contextSnippet }) {
  return [mode, selectionType, sentence, selectionText, contextSnippet].join('::')
}

function buildContextualWordTranslation(sourceSentence, translatedSentence, sourceWordIndex, selectedWordCount = 1) {
  const sourceWords = getSentenceWords(sourceSentence)
  const translatedWords = getSentenceWords(translatedSentence)

  if (translatedWords.length === 0) {
    return ''
  }

  if (sourceWords.length <= selectedWordCount) {
    return translatedWords.join(' ')
  }

  const startRatio = sourceWordIndex / sourceWords.length
  const endRatio = (sourceWordIndex + selectedWordCount) / sourceWords.length
  let translatedStart = Math.floor(startRatio * translatedWords.length)
  let translatedEnd = Math.ceil(endRatio * translatedWords.length) - 1

  translatedStart = Math.max(0, Math.min(translatedStart, translatedWords.length - 1))
  translatedEnd = Math.max(translatedStart, Math.min(translatedEnd, translatedWords.length - 1))

  return translatedWords.slice(translatedStart, translatedEnd + 1).join(' ')
}

function getGoogleAiApiKey() {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_AI_API_KEY. Add it to .env.local and restart Expo.')
  }

  return apiKey
}

function extractGoogleAiText(payload) {
  return payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text ?? '').join('').trim() ?? ''
}

function extractJsonBlock(text) {
  const startIndex = text.indexOf('{')
  const endIndex = text.lastIndexOf('}')

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('Google AI returned an invalid payload.')
  }

  return text.slice(startIndex, endIndex + 1)
}

function buildFallbackAnalysis({ selectionText, selectionType, localPhrasalVerb, localBaseVerb, localParticle }) {
  return {
    selectionType,
    detectedPhrasalVerb: localPhrasalVerb || (selectionType === 'phrasal_verb' ? selectionText : ''),
    baseVerb: localBaseVerb,
    baseVerbMeaning: '',
    phrasalVerbMeaning: '',
    particle: localParticle,
    particleContribution: PARTICLE_HINTS[localParticle] ?? '',
  }
}

async function translateWithGoogleAi({
  sentence,
  selectionText,
  selectionType,
  contextSnippet,
  wordIndexInSentence,
  selectedWordCount,
  localPhrasalVerb,
  localBaseVerb,
  localParticle,
}) {
  const apiKey = getGoogleAiApiKey()
  const prompt = [
    'Translate from English to natural Latin American Spanish.',
    'Analyze whether the selected text is a standalone word or part of a phrasal verb in this sentence.',
    'If it is a phrasal verb, give short learner-friendly explanations.',
    'Return JSON only with this exact shape:',
    '{"sentenceTranslation":"...","selectionTranslation":"...","selectionType":"single_word|phrasal_verb","detectedPhrasalVerb":"...","baseVerb":"...","baseVerbMeaning":"...","phrasalVerbMeaning":"...","particle":"...","particleContribution":"..."}',
    'The selectionTranslation and phrasalVerbMeaning must be short natural Latin American Spanish.',
    'Keep baseVerbMeaning and particleContribution very short. If there is no phrasal verb, leave detectedPhrasalVerb, phrasalVerbMeaning, particle, and particleContribution as empty strings.',
    `Sentence: ${sentence}`,
    `Selected text: ${selectionText}`,
    `Expected selection type from local detection: ${selectionType}`,
    `Local phrasal verb candidate: ${localPhrasalVerb || 'none'}`,
    `Local base verb candidate: ${localBaseVerb || 'none'}`,
    `Local particle candidate: ${localParticle || 'none'}`,
    `Context snippet: ${contextSnippet}`,
  ].join('\n')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_AI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    },
  )

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Google AI request failed.')
  }

  const rawText = extractGoogleAiText(payload)
  if (!rawText) {
    throw new Error('Google AI returned an empty response.')
  }

  const fallbackAnalysis = buildFallbackAnalysis({
    selectionText,
    selectionType,
    localPhrasalVerb,
    localBaseVerb,
    localParticle,
  })

  let parsed
  try {
    parsed = JSON.parse(extractJsonBlock(rawText))
  } catch {
    parsed = {
      sentenceTranslation: rawText,
      selectionTranslation: buildContextualWordTranslation(
        sentence,
        rawText,
        wordIndexInSentence,
        selectedWordCount,
      ),
      ...fallbackAnalysis,
    }
  }

  return {
    sentenceTranslation: String(parsed?.sentenceTranslation ?? '').trim(),
    selectionTranslation: String(parsed?.selectionTranslation ?? '').trim(),
    selectionType: String(parsed?.selectionType ?? fallbackAnalysis.selectionType).trim(),
    detectedPhrasalVerb: String(parsed?.detectedPhrasalVerb ?? fallbackAnalysis.detectedPhrasalVerb).trim(),
    baseVerb: String(parsed?.baseVerb ?? fallbackAnalysis.baseVerb).trim(),
    baseVerbMeaning: String(parsed?.baseVerbMeaning ?? fallbackAnalysis.baseVerbMeaning).trim(),
    phrasalVerbMeaning: String(parsed?.phrasalVerbMeaning ?? fallbackAnalysis.phrasalVerbMeaning).trim(),
    particle: String(parsed?.particle ?? fallbackAnalysis.particle).trim(),
    particleContribution: String(parsed?.particleContribution ?? fallbackAnalysis.particleContribution).trim(),
  }
}

function buildReadingItems(text, idPrefix = '') {
  const items = []
  const sentenceMatches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []

  sentenceMatches.forEach((sentence, sentenceIndex) => {
    const sentenceText = sentence.trim()
    const sentenceTokens = sentence.split(/(\[\[REF:[^\]]+\]\]|\s+)/)
    const wordEntries = []
    let wordIndexInSentence = 0

    sentenceTokens.forEach((token, tokenIndex) => {
      const referenceMatch = token.match(/^\[\[REF:(.+)\]\]$/)
      if (referenceMatch) {
        wordEntries.push({
          tokenIndex,
          word: referenceMatch[1],
          normalizedWord: '',
          lemma: '',
          wordIndexInSentence,
          isReference: true,
        })
        return
      }

      const word = getWordValue(token)
      if (!word) {
        return
      }

      wordEntries.push({
        tokenIndex,
        word,
        normalizedWord: normalizeWord(token),
        lemma: lemmatizeVerb(token),
        wordIndexInSentence,
      })
      wordIndexInSentence += 1
    })

    const phraseStarts = new Map()
    const coveredWordIndexes = new Set()

    for (let index = 0; index < wordEntries.length - 1; index += 1) {
      if (coveredWordIndexes.has(index)) {
        continue
      }

      const currentWord = wordEntries[index]
      const nextWord = wordEntries[index + 1]
      const candidate = `${currentWord.lemma} ${nextWord.normalizedWord}`
      if (!PHRASAL_VERBS.has(candidate)) {
        continue
      }

      phraseStarts.set(currentWord.tokenIndex, {
        id: `${idPrefix}${sentenceIndex}-${currentWord.tokenIndex}-${nextWord.tokenIndex}`,
        token: sentenceTokens.slice(currentWord.tokenIndex, nextWord.tokenIndex + 1).join(''),
        sentence: sentenceText,
        selectionText: `${currentWord.word} ${nextWord.word}`,
        word: `${currentWord.word} ${nextWord.word}`,
        selectionType: 'phrasal_verb',
        wordIndexInSentence: currentWord.wordIndexInSentence,
        selectedWordCount: 2,
        endTokenIndex: nextWord.tokenIndex,
        localPhrasalVerb: candidate,
        localBaseVerb: currentWord.lemma,
        localParticle: nextWord.normalizedWord,
      })

      coveredWordIndexes.add(index)
      coveredWordIndexes.add(index + 1)
      index += 1
    }

    const standaloneWords = new Map(
      wordEntries.map((entry) => [
        entry.tokenIndex,
        {
          id: `${idPrefix}${sentenceIndex}-${entry.tokenIndex}`,
          token: entry.isReference ? entry.word : sentenceTokens[entry.tokenIndex],
          sentence: sentenceText,
          selectionText: entry.isReference ? '' : entry.word,
          word: entry.isReference ? '' : entry.word,
          selectionType: entry.isReference ? 'reference' : 'single_word',
          wordIndexInSentence: entry.wordIndexInSentence,
          selectedWordCount: entry.isReference ? 0 : 1,
          endTokenIndex: entry.tokenIndex,
          localPhrasalVerb: '',
          localBaseVerb: entry.lemma,
          localParticle: '',
        },
      ]),
    )

    for (let tokenIndex = 0; tokenIndex < sentenceTokens.length; tokenIndex += 1) {
      const phraseItem = phraseStarts.get(tokenIndex)
      if (phraseItem) {
        items.push(phraseItem)
        tokenIndex = phraseItem.endTokenIndex
        continue
      }

      const standaloneItem = standaloneWords.get(tokenIndex)
      if (standaloneItem) {
        const matchedWordIndex = wordEntries.findIndex((entry) => entry.tokenIndex === tokenIndex)
        if (!coveredWordIndexes.has(matchedWordIndex)) {
          items.push(standaloneItem)
          continue
        }
      }

      items.push({
        id: `${idPrefix}${sentenceIndex}-${tokenIndex}`,
        token: sentenceTokens[tokenIndex],
        sentence: sentenceText,
        word: '',
        selectionText: '',
        selectionType: 'text',
        wordIndexInSentence: -1,
        selectedWordCount: 0,
      })
    }
  })

  return items
}

function LibraryCard({ book, onPress, onDelete, theme }) {
  return (
    <View style={[styles.bookCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable onPress={onPress} style={styles.bookCardMain}>
        {book.coverDataUri ? (
          <Image source={{ uri: book.coverDataUri }} style={styles.bookCover} />
        ) : (
          <View style={[styles.bookCoverFallback, { backgroundColor: theme.coverFallback }]}>
            <Text style={[styles.bookCoverFallbackText, { color: theme.coverFallbackText }]}>EPUB</Text>
          </View>
        )}
        <View style={styles.bookMeta}>
          <Text numberOfLines={2} style={[styles.bookTitle, { color: theme.text }]}>{book.title}</Text>
          <Text numberOfLines={1} style={[styles.bookSource, { color: theme.textMuted }]}>{book.sourceName}</Text>
          <Text style={[styles.bookProgress, { color: theme.textSoft }]}>Chapter {book.currentChapterIndex + 1} of {book.chapterCount}</Text>
          <Text style={[styles.bookProgress, { color: theme.textSoft }]}>Page {(book.currentPageIndex || 0) + 1}</Text>
        </View>
      </Pressable>
      {!book.isSample ? (
        <Pressable onPress={onDelete} style={[styles.deleteBookButton, { backgroundColor: theme.dangerSurface }]}>
          <Text style={[styles.deleteBookButtonText, { color: theme.dangerText }]}>Delete</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export default function App() {
  const readerScrollRef = useRef(null)
  const [screen, setScreen] = useState('library')
  const [selectedMode, setSelectedMode] = useState('ml-kit')
  const [books, setBooks] = useState([SAMPLE_BOOK])
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentBookId, setCurrentBookId] = useState(SAMPLE_BOOK_ID)
  const [bookChapters, setBookChapters] = useState(SAMPLE_CHAPTERS)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [readingText, setReadingText] = useState(SAMPLE_CHAPTERS[0].text)
  const [bookLabel, setBookLabel] = useState(SAMPLE_BOOK.title)
  const [importStatus, setImportStatus] = useState('idle')
  const [importError, setImportError] = useState('')
  const [themeMode, setThemeMode] = useState('light')
  const [fontScale, setFontScale] = useState('md')
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState(false)
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false)
  const [selectedWordId, setSelectedWordId] = useState('')
  const [selectedWord, setSelectedWord] = useState('')
  const [selectedContext, setSelectedContext] = useState('')
  const [selectedType, setSelectedType] = useState('single_word')
  const [translatedText, setTranslatedText] = useState('')
  const [translatedWord, setTranslatedWord] = useState('')
  const [translationStatus, setTranslationStatus] = useState('idle')
  const [translationError, setTranslationError] = useState('')
  const [analysisDetails, setAnalysisDetails] = useState({
    baseVerb: '',
    baseVerbMeaning: '',
    detectedPhrasalVerb: '',
    phrasalVerbMeaning: '',
    particle: '',
    particleContribution: '',
  })
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [wordLayouts, setWordLayouts] = useState({})
  const [paragraphLayouts, setParagraphLayouts] = useState({})
  const [paragraphLayout, setParagraphLayout] = useState(null)
  const [scrollViewLayout, setScrollViewLayout] = useState(null)
  const [readerContentHeight, setReaderContentHeight] = useState(0)
  const [rootLayout, setRootLayout] = useState(null)
  const [scrollOffsetY, setScrollOffsetY] = useState(0)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const [pendingRestoreScrollY, setPendingRestoreScrollY] = useState(0)
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME
  const fontMetrics = FONT_SCALE_OPTIONS[fontScale] || FONT_SCALE_OPTIONS.md

  const chapterEntry = bookChapters[currentChapterIndex] || SAMPLE_CHAPTERS[0]
  const chapterTitle = chapterEntry?.title || getChapterHeading(readingText) || `Chapter ${currentChapterIndex + 1}`
  const chapterPages = useMemo(() => splitChapterEntryIntoPages(chapterEntry), [chapterEntry])
  const currentPageBlocks = chapterPages[currentPageIndex] || chapterPages[0] || []
  const readingContentBlocks = useMemo(
    () =>
      currentPageBlocks.map((block, blockIndex) => {
        if (block.type === 'image') {
          return {
            id: `image-${blockIndex}`,
            type: 'image',
            uri: block.uri,
          }
        }

        const textValue = blockIndex === 0
          ? stripRepeatedChapterTitle(stripLeadingChapterHeading(block.text || '', chapterTitle), chapterTitle)
          : block.text || ''

        return {
          id: `paragraph-${blockIndex}`,
          type: block.type === 'subhead' ? 'subhead' : 'text',
          items: buildReadingItems(textValue, `p${blockIndex}-`),
        }
      }).filter((block) => block.type === 'image' || block.items.length > 0),
    [currentPageBlocks, chapterTitle],
  )

  useEffect(() => {
    async function hydrateLibrary() {
      try {
        const [storedLibrary, storedLastBookId, storedThemeMode, storedFontScale] = await Promise.all([
          AsyncStorage.getItem(STORAGE_LIBRARY_KEY),
          AsyncStorage.getItem(STORAGE_LAST_BOOK_ID_KEY),
          AsyncStorage.getItem(STORAGE_THEME_MODE_KEY),
          AsyncStorage.getItem(STORAGE_FONT_SCALE_KEY),
        ])
        const parsedLibrary = storedLibrary ? JSON.parse(storedLibrary) : []
        const normalizedLibrary = parsedLibrary.map((book) => ({
          currentPageIndex: 0,
          ...book,
        }))
        setBooks(normalizedLibrary.length > 0 ? [SAMPLE_BOOK, ...normalizedLibrary] : [SAMPLE_BOOK])
        setCurrentBookId(storedLastBookId || SAMPLE_BOOK_ID)
        if (storedThemeMode === 'dark' || storedThemeMode === 'light') {
          setThemeMode(storedThemeMode)
        }
        if (storedFontScale && FONT_SCALE_OPTIONS[storedFontScale]) {
          setFontScale(storedFontScale)
        }
      } finally {
        setIsHydrated(true)
      }
    }

    hydrateLibrary()
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const persistableBooks = books.filter((book) => !book.isSample)
    AsyncStorage.setItem(STORAGE_LIBRARY_KEY, JSON.stringify(persistableBooks)).catch(() => {})
  }, [books, isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    AsyncStorage.setItem(STORAGE_LAST_BOOK_ID_KEY, currentBookId).catch(() => {})
  }, [currentBookId, isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    AsyncStorage.setItem(STORAGE_THEME_MODE_KEY, themeMode).catch(() => {})
  }, [themeMode, isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    AsyncStorage.setItem(STORAGE_FONT_SCALE_KEY, fontScale).catch(() => {})
  }, [fontScale, isHydrated])

  useEffect(() => {
    if (screen !== 'reader' || pendingRestoreScrollY <= 0 || !readerScrollRef.current) {
      return
    }

    const timeoutId = setTimeout(() => {
      readerScrollRef.current?.scrollTo({ y: pendingRestoreScrollY, animated: false })
      setScrollOffsetY(pendingRestoreScrollY)
      setPendingRestoreScrollY(0)
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [screen, pendingRestoreScrollY, readingText])

  useEffect(() => {
    if (screen !== 'reader') {
      return
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      saveCurrentProgressAndGoBack()
      return true
    })

    return () => subscription.remove()
  }, [screen, currentChapterIndex, currentPageIndex, scrollOffsetY, currentBookId])

  function resetSelection() {
    setSelectedWordId('')
    setSelectedWord('')
    setSelectedContext('')
    setSelectedType('single_word')
    setTranslatedText('')
    setTranslatedWord('')
    setTranslationStatus('idle')
    setTranslationError('')
    setAnalysisDetails({
      baseVerb: '',
      baseVerbMeaning: '',
      detectedPhrasalVerb: '',
      phrasalVerbMeaning: '',
      particle: '',
      particleContribution: '',
    })
    setIsTooltipVisible(false)
    setWordLayouts({})
    setParagraphLayouts({})
    setParagraphLayout(null)
    setReaderContentHeight(0)
    setScrollOffsetY(0)
    setTooltipHeight(0)
  }

  async function loadBookPayload(book) {
    if (book.isSample) {
      return { chapterEntries: SAMPLE_CHAPTERS }
    }

    const payloadText = await FileSystem.readAsStringAsync(book.bookPath)
    return JSON.parse(payloadText)
  }

  async function openBook(book) {
    resetSelection()
    translationCache.clear()
    setCurrentBookId(book.id)
    setBookLabel(book.title)
    setIsChapterMenuOpen(false)
    setIsPageMenuOpen(false)
    setPendingRestoreScrollY(book.lastScrollY || 0)

    const payload = await loadBookPayload(book)
    const chapterEntries = payload.chapterEntries?.length
      ? payload.chapterEntries
      : (payload.chapters || [SAMPLE_READING_TEXT]).map((chapterText, index) => ({
          title: `Chapter ${index + 1}`,
          text: chapterText,
          blocks: [{ type: 'text', text: chapterText }],
        }))
    const nextChapterIndex = Math.max(0, Math.min(book.currentChapterIndex || 0, chapterEntries.length - 1))
    const pages = splitChapterIntoPages(chapterEntries[nextChapterIndex].text)
    const nextPageIndex = Math.max(0, Math.min(book.currentPageIndex || 0, pages.length - 1))

    setBookChapters(chapterEntries)
    setCurrentChapterIndex(nextChapterIndex)
    setCurrentPageIndex(nextPageIndex)
    setReadingText(chapterEntries[nextChapterIndex].text)
    setScreen('reader')
  }

  function updateBookProgress(patch) {
    setBooks((currentBooks) =>
      currentBooks.map((book) =>
        book.id === currentBookId
          ? {
              ...book,
              ...patch,
            }
          : book,
      ),
    )
  }

  function saveCurrentProgressAndGoBack() {
    updateBookProgress({
      currentChapterIndex,
      currentPageIndex,
      lastScrollY: scrollOffsetY,
    })
    setScreen('library')
    setIsChapterMenuOpen(false)
    setIsPageMenuOpen(false)
    setIsTooltipVisible(false)
  }

  async function handleDeleteBook(bookId) {
    const bookToDelete = books.find((book) => book.id === bookId)

    if (!bookToDelete || bookToDelete.isSample) {
      return
    }

    try {
      if (bookToDelete.bookPath) {
        const fileInfo = await FileSystem.getInfoAsync(bookToDelete.bookPath)
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(bookToDelete.bookPath, { idempotent: true })
        }
      }
    } catch {}

    setBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId))

    if (currentBookId === bookId) {
      setCurrentBookId(SAMPLE_BOOK_ID)
    }
  }

  async function handleImportEpub() {
    setImportError('')
    setImportStatus('loading')

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/epub+zip', '.epub'],
        copyToCacheDirectory: true,
        multiple: false,
      })

      if (result.canceled || !result.assets?.[0]) {
        setImportStatus('idle')
        return
      }

      const asset = result.assets[0]
      const extracted = await extractBookFromEpub(asset.uri)
      const booksDir = await ensureBooksDirectory()
      const bookId = `book-${Date.now()}`
      const bookPath = `${booksDir}/${bookId}.json`

      await FileSystem.writeAsStringAsync(bookPath, JSON.stringify({ chapterEntries: extracted.chapterEntries }))

      const nextBook = {
        id: bookId,
        title: extracted.title,
        sourceName: asset.name || 'Imported EPUB',
        bookPath,
        coverDataUri: extracted.coverDataUri,
        chapterCount: extracted.chapterEntries.length,
        currentChapterIndex: 0,
        currentPageIndex: 0,
        lastScrollY: 0,
        isSample: false,
      }

      setBooks((currentBooks) => [nextBook, ...currentBooks.filter((book) => book.id !== nextBook.id)])
      setImportStatus('success')
      await openBook(nextBook)
    } catch (error) {
      setImportStatus('error')
      setImportError(error instanceof Error ? error.message : 'Failed to import EPUB.')
    }
  }

  async function changeChapter(nextIndex, nextPageIndex = 0) {
    if (nextIndex < 0 || nextIndex >= bookChapters.length) {
      return
    }

    const nextChapter = bookChapters[nextIndex]
    const pages = splitChapterIntoPages(nextChapter.text)
    const safePageIndex = Math.max(0, Math.min(nextPageIndex, pages.length - 1))

    resetSelection()
    translationCache.clear()
    setIsChapterMenuOpen(false)
    setIsPageMenuOpen(false)
    updateBookProgress({ currentChapterIndex: nextIndex, currentPageIndex: safePageIndex, lastScrollY: 0 })
    setCurrentChapterIndex(nextIndex)
    setCurrentPageIndex(safePageIndex)
    setReadingText(nextChapter.text)
    setPendingRestoreScrollY(0)
    readerScrollRef.current?.scrollTo({ y: 0, animated: false })
  }

  function jumpToPage(nextPageIndex) {
    if (nextPageIndex < 0 || nextPageIndex >= chapterPages.length) {
      return
    }

    resetSelection()
    translationCache.clear()
    setIsPageMenuOpen(false)
    updateBookProgress({
      currentChapterIndex,
      currentPageIndex: nextPageIndex,
      lastScrollY: 0,
    })
    setCurrentPageIndex(nextPageIndex)
    setPendingRestoreScrollY(0)
    readerScrollRef.current?.scrollTo({ y: 0, animated: false })
  }

  function changePage(direction) {
    const nextPageIndex = currentPageIndex + direction

    if (nextPageIndex >= 0 && nextPageIndex < chapterPages.length) {
      jumpToPage(nextPageIndex)
      return
    }

    if (direction > 0 && currentChapterIndex < bookChapters.length - 1) {
      changeChapter(currentChapterIndex + 1, 0)
      return
    }

    if (direction < 0 && currentChapterIndex > 0) {
      const previousChapterIndex = currentChapterIndex - 1
      const previousPages = splitChapterIntoPages(bookChapters[previousChapterIndex].text)
      changeChapter(previousChapterIndex, previousPages.length - 1)
    }
  }

  function handleParagraphBlockLayout(paragraphId, event) {
    const { x, y, width, height } = event.nativeEvent.layout

    setParagraphLayouts((currentLayouts) => {
      const currentLayout = currentLayouts[paragraphId]
      if (
        currentLayout &&
        currentLayout.x === x &&
        currentLayout.y === y &&
        currentLayout.width === width &&
        currentLayout.height === height
      ) {
        return currentLayouts
      }

      return {
        ...currentLayouts,
        [paragraphId]: { x, y, width, height },
      }
    })
  }

  function handleWordLayout(itemId, paragraphId, event) {
    const { x, y, width, height } = event.nativeEvent.layout

    setWordLayouts((currentLayouts) => {
      const currentLayout = currentLayouts[itemId]
      if (
        currentLayout &&
        currentLayout.x === x &&
        currentLayout.y === y &&
        currentLayout.width === width &&
        currentLayout.height === height
      ) {
        return currentLayouts
      }

      return {
        ...currentLayouts,
        [itemId]: { x, y, width, height, paragraphId },
      }
    })
  }

  async function handleWordPress(item) {
    const contextSnippet = buildContextSnippet(item.sentence, item.wordIndexInSentence, item.selectedWordCount)
    const cacheKey = buildCacheKey({
      mode: selectedMode,
      sentence: item.sentence,
      selectionText: item.selectionText,
      selectionType: item.selectionType,
      contextSnippet,
    })

    setSelectedWordId(item.id)
    setSelectedWord(item.selectionText)
    setSelectedContext(contextSnippet)
    setSelectedType(item.selectionType)
    setTranslatedText('')
    setTranslatedWord('')
    setTranslationError('')
    setAnalysisDetails({
      baseVerb: item.localBaseVerb ?? '',
      baseVerbMeaning: '',
      detectedPhrasalVerb: item.localPhrasalVerb ?? '',
      phrasalVerbMeaning: '',
      particle: item.localParticle ?? '',
      particleContribution: PARTICLE_HINTS[item.localParticle] ?? '',
    })
    setIsTooltipVisible(true)

    const cachedEntry = translationCache.get(cacheKey)
    if (cachedEntry) {
      setTranslatedText(cachedEntry.translatedText)
      setTranslatedWord(cachedEntry.translatedWord)
      setSelectedType(cachedEntry.selectedType)
      setAnalysisDetails(cachedEntry.analysisDetails)
      setTranslationStatus('success')
      return
    }

    setTranslationStatus('loading')

    try {
      if (selectedMode === 'google-ai') {
        const result = await translateWithGoogleAi({
          sentence: item.sentence,
          selectionText: item.selectionText,
          selectionType: item.selectionType,
          contextSnippet,
          wordIndexInSentence: item.wordIndexInSentence,
          selectedWordCount: item.selectedWordCount,
          localPhrasalVerb: item.localPhrasalVerb,
          localBaseVerb: item.localBaseVerb,
          localParticle: item.localParticle,
        })

        const nextTranslatedText = result.sentenceTranslation
        const nextTranslatedWord =
          result.selectionTranslation ||
          buildContextualWordTranslation(
            item.sentence,
            result.sentenceTranslation,
            item.wordIndexInSentence,
            item.selectedWordCount,
          )
        const nextSelectedType = result.selectionType || item.selectionType
        const nextAnalysisDetails = {
          baseVerb: result.baseVerb || item.localBaseVerb || '',
          baseVerbMeaning: result.baseVerbMeaning,
          detectedPhrasalVerb: result.detectedPhrasalVerb || item.localPhrasalVerb || '',
          phrasalVerbMeaning: result.phrasalVerbMeaning || result.selectionTranslation || '',
          particle: result.particle || item.localParticle || '',
          particleContribution:
            result.particleContribution || PARTICLE_HINTS[result.particle || item.localParticle] || '',
        }

        translationCache.set(cacheKey, {
          translatedText: nextTranslatedText,
          translatedWord: nextTranslatedWord,
          selectedType: nextSelectedType,
          analysisDetails: nextAnalysisDetails,
        })

        setTranslatedText(nextTranslatedText)
        setTranslatedWord(nextTranslatedWord)
        setSelectedType(nextSelectedType)
        setAnalysisDetails(nextAnalysisDetails)
        setTranslationStatus('success')
        return
      }

      const result = await TranslateText.translate({
        text: contextSnippet,
        sourceLanguage: TranslateLanguage.ENGLISH,
        targetLanguage: TranslateLanguage.SPANISH,
        downloadModelIfNeeded: true,
      })

      const translatedValue = typeof result === 'string' ? result : String(result ?? '')
      const nextAnalysisDetails = {
        baseVerb: item.localBaseVerb ?? '',
        baseVerbMeaning: '',
        detectedPhrasalVerb: item.localPhrasalVerb ?? '',
        phrasalVerbMeaning: '',
        particle: item.localParticle ?? '',
        particleContribution: PARTICLE_HINTS[item.localParticle] ?? '',
      }

      translationCache.set(cacheKey, {
        translatedText: translatedValue,
        translatedWord: '',
        selectedType: item.selectionType,
        analysisDetails: nextAnalysisDetails,
      })

      setTranslatedText(translatedValue)
      setAnalysisDetails(nextAnalysisDetails)
      setTranslationStatus('success')
    } catch (error) {
      setTranslationStatus('error')
      setTranslationError(
        error instanceof Error
          ? error.message
          : 'Translation failed. Build an Android development app to use ML Kit.',
      )
    }
  }

  function closeTooltip() {
    setIsTooltipVisible(false)
  }

  const readingBlocks = useMemo(
    () =>
      readingContentBlocks.map((block) => {
        if (block.type === 'image') {
          return (
            <View key={block.id} style={[styles.imageBlock, { backgroundColor: theme.borderSoft }]}>
              <Image resizeMode="contain" source={{ uri: block.uri }} style={[styles.inlineImage, { backgroundColor: theme.borderSoft }]} />
            </View>
          )
        }

        return (
          <View key={block.id} onLayout={(event) => handleParagraphBlockLayout(block.id, event)} style={styles.paragraphBlock}>
            <View style={styles.paragraph}>
              {block.items.map((item) => {
                if (item.selectionType === 'reference') {
                  return (
                    <Text key={item.id} style={[styles.referenceText, { color: theme.textSoft }]}>
                      {item.token}
                    </Text>
                  )
                }

                if (!item.word) {
                  return (
                    <Text
                      key={item.id}
                      style={[
                        block.type === 'subhead' ? styles.subheadText : styles.bodyText,
                        { color: block.type === 'subhead' ? theme.text : theme.textMuted },
                        block.type === 'subhead'
                          ? { fontSize: fontMetrics.subhead, lineHeight: fontMetrics.subheadLineHeight }
                          : { fontSize: fontMetrics.body, lineHeight: fontMetrics.lineHeight },
                      ]}
                    >
                      {item.token}
                    </Text>
                  )
                }

                return (
                  <Pressable
                    key={item.id}
                    onLayout={(event) => handleWordLayout(item.id, block.id, event)}
                    onPress={() => handleWordPress(item)}
                  >
                    <Text
                      style={[
                        block.type === 'subhead' ? styles.subheadWord : styles.word,
                        { color: block.type === 'subhead' ? theme.text : theme.text },
                        block.type === 'subhead'
                          ? { fontSize: fontMetrics.subhead, lineHeight: fontMetrics.subheadLineHeight }
                          : { fontSize: fontMetrics.body, lineHeight: fontMetrics.lineHeight },
                        item.selectionType === 'phrasal_verb'
                          ? [styles.phrasalWord, { textDecorationColor: theme.accent }]
                          : null,
                      ]}
                    >
                      {item.token}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )
      }),
    [fontMetrics, readingContentBlocks, selectedMode, theme],
  )

  const anchorLayout = selectedWordId ? wordLayouts[selectedWordId] : null
  const anchorParagraphLayout = anchorLayout?.paragraphId ? paragraphLayouts[anchorLayout.paragraphId] : null
  const canPositionTooltip = isTooltipVisible && anchorLayout && anchorParagraphLayout && paragraphLayout && scrollViewLayout && rootLayout
  const anchorCenterX = canPositionTooltip
    ? scrollViewLayout.x + paragraphLayout.x + anchorParagraphLayout.x + anchorLayout.x + anchorLayout.width / 2
    : 0
  const anchorTop = canPositionTooltip
    ? scrollViewLayout.y + paragraphLayout.y + anchorParagraphLayout.y + anchorLayout.y - scrollOffsetY
    : 0
  const anchorBottom = canPositionTooltip ? anchorTop + anchorLayout.height : 0
  const tooltipLeft = canPositionTooltip
    ? Math.min(
        Math.max(TOOLTIP_SCREEN_MARGIN, anchorCenterX - TOOLTIP_WIDTH / 2),
        Math.max(TOOLTIP_SCREEN_MARGIN, rootLayout.width - TOOLTIP_WIDTH - TOOLTIP_SCREEN_MARGIN),
      )
    : TOOLTIP_SCREEN_MARGIN
  const showTooltipAbove = canPositionTooltip && anchorTop - tooltipHeight - TOOLTIP_GAP >= TOOLTIP_MIN_TOP
  const tooltipTop = canPositionTooltip
    ? showTooltipAbove
      ? Math.max(TOOLTIP_MIN_TOP, anchorTop - tooltipHeight - TOOLTIP_GAP)
      : Math.max(
          TOOLTIP_MIN_TOP,
          Math.min(anchorBottom + TOOLTIP_GAP, rootLayout.height - tooltipHeight - TOOLTIP_SCREEN_MARGIN),
        )
    : TOOLTIP_MIN_TOP


  const readerViewportHeight = scrollViewLayout?.height ?? 0
  const readerScrollRange = Math.max(0, readerContentHeight - readerViewportHeight)
  const scrollbarVisible = readerViewportHeight > 0 && readerContentHeight > readerViewportHeight + 24
  const scrollbarThumbHeight = scrollbarVisible
    ? Math.max(42, (readerViewportHeight * readerViewportHeight) / readerContentHeight)
    : 0
  const scrollbarTrackTravel = scrollbarVisible ? Math.max(0, readerViewportHeight - scrollbarThumbHeight) : 0
  const scrollbarThumbTop = scrollbarVisible && readerScrollRange > 0
    ? (scrollOffsetY / readerScrollRange) * scrollbarTrackTravel
    : 0

  if (!isHydrated) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <View style={styles.centerState}>
          <Text style={[styles.centerStateTitle, { color: theme.text }]}>Loading library...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (screen === 'library') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={styles.libraryContent} style={[styles.screen, { backgroundColor: theme.background }]}>
          <View style={styles.libraryTopRow}>
            <View style={styles.libraryHeading}>
              <Text style={[styles.kicker, { color: theme.textSoft }]}>Library</Text>
              <Text style={[styles.title, { color: theme.text }]}>Your Books</Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Import EPUB files and continue reading each book where you left it.
          </Text>

          <Pressable onPress={handleImportEpub} style={[styles.importButton, { backgroundColor: theme.accent }]}>
            <Text style={[styles.primaryButtonText, { color: theme.textInverted }]}>
              {importStatus === 'loading' ? 'Importing EPUB...' : 'Import EPUB'}
            </Text>
          </Pressable>
          {importStatus === 'success' ? <Text style={[styles.importStatus, { color: theme.success }]}>EPUB imported.</Text> : null}
          {importStatus === 'error' ? <Text style={[styles.importError, { color: theme.error }]}>{importError}</Text> : null}

          <View style={styles.bookGrid}>
            {books.map((book) => (
              <LibraryCard
                key={book.id}
                book={book}
                onPress={() => openBook(book)}
                onDelete={() => handleDeleteBook(book.id)}
                theme={theme}
              />
            ))}
          </View>

          <View style={styles.libraryBottomControls}>
            <View style={styles.libraryControlBlock}>
              <Text style={[styles.libraryControlLabel, { color: theme.textSoft }]}>Theme</Text>
              <View style={[styles.themeToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Pressable
                  onPress={() => setThemeMode('light')}
                  style={[
                    styles.themeToggleButton,
                    { backgroundColor: themeMode === 'light' ? theme.accent : 'transparent' },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeToggleText,
                      { color: themeMode === 'light' ? theme.textInverted : theme.textMuted },
                    ]}
                  >
                    Light
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setThemeMode('dark')}
                  style={[
                    styles.themeToggleButton,
                    { backgroundColor: themeMode === 'dark' ? theme.accent : 'transparent' },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeToggleText,
                      { color: themeMode === 'dark' ? theme.textInverted : theme.textMuted },
                    ]}
                  >
                    Dark
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.libraryControlBlock}>
              <Text style={[styles.libraryControlLabel, { color: theme.textSoft }]}>Text Size</Text>
              <View style={styles.libraryFontRow}>
                <View style={[styles.themeToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {Object.entries(FONT_SCALE_OPTIONS).map(([optionKey, option]) => (
                    <Pressable
                      key={optionKey}
                      onPress={() => setFontScale(optionKey)}
                      style={[
                        styles.themeToggleButton,
                        { backgroundColor: fontScale === optionKey ? theme.accent : 'transparent' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.themeToggleText,
                          { color: fontScale === optionKey ? theme.textInverted : theme.textMuted },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.libraryFontPreview,
                    {
                      color: theme.text,
                      fontSize: fontMetrics.body,
                      lineHeight: fontMetrics.lineHeight,
                    },
                  ]}
                >
                  Reading
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} onLayout={(event) => setRootLayout(event.nativeEvent.layout)}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.kicker, { color: theme.textSoft }]}>Reader</Text>
        <Text numberOfLines={2} style={[styles.headerTitle, { color: theme.text }]}>{bookLabel}</Text>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => setIsChapterMenuOpen((currentValue) => !currentValue)}
            style={[styles.chapterPickerButton, styles.modeButtonInactive, { backgroundColor: theme.accentMuted }]}
          >
            <Text numberOfLines={1} style={[styles.chapterPickerButtonText, { color: theme.accentText }]}>{chapterTitle}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              { backgroundColor: selectedMode === 'ml-kit' ? theme.accent : theme.accentMuted },
            ]}
            onPress={() => setSelectedMode('ml-kit')}
          >
            <Text style={selectedMode === 'ml-kit' ? [styles.primaryButtonText, { color: theme.textInverted }] : [styles.inactiveHeaderButtonText, { color: theme.accentText }]}>ML Kit</Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              { backgroundColor: selectedMode === 'google-ai' ? theme.accent : theme.accentMuted },
            ]}
            onPress={() => setSelectedMode('google-ai')}
          >
            <Text style={selectedMode === 'google-ai' ? [styles.primaryButtonText, { color: theme.textInverted }] : [styles.inactiveHeaderButtonText, { color: theme.accentText }]}>Google AI</Text>
          </Pressable>
        </View>
        {isChapterMenuOpen ? (
          <View style={[styles.chapterMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ScrollView nestedScrollEnabled style={styles.chapterMenuScroll}>
              {bookChapters.map((chapter, index) => (
                <Pressable
                  key={`${chapter.title}-${index}`}
                  onPress={() => changeChapter(index, 0)}
                  style={[
                    styles.chapterMenuItem,
                    { borderBottomColor: theme.borderSoft },
                    index === currentChapterIndex ? [styles.chapterMenuItemActive, { backgroundColor: theme.accentMuted }] : null,
                  ]}
                >
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.chapterMenuItemText,
                      { color: index === currentChapterIndex ? theme.text : theme.textMuted },
                    ]}
                  >
                    {chapter.title || `Chapter ${index + 1}`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <ScrollView
        ref={readerScrollRef}
        contentContainerStyle={styles.scrollContent}
        onLayout={(event) => setScrollViewLayout(event.nativeEvent.layout)}
        onContentSizeChange={(_, height) => setReaderContentHeight(height)}
        onScroll={(event) => setScrollOffsetY(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        persistentScrollbar
        showsVerticalScrollIndicator
        indicatorStyle={themeMode === 'dark' ? 'white' : 'black'}
        style={[styles.screen, { backgroundColor: theme.background }]}
      >
        <View style={styles.readerTopBar}>
          <Pressable
            onPress={() => setIsPageMenuOpen((currentValue) => !currentValue)}
            style={[styles.pagePickerButton, { backgroundColor: theme.accentMuted }]}
          >
            <Text style={[styles.pagePickerButtonText, { color: theme.accentText }]}>Page {currentPageIndex + 1} of {chapterPages.length}</Text>
          </Pressable>
        </View>
        {isPageMenuOpen ? (
          <View style={styles.pageMenu}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pageMenuContent}>
              {chapterPages.map((_, index) => (
                <Pressable
                  key={`page-${index}`}
                  onPress={() => jumpToPage(index)}
                  style={[
                    styles.pageMenuItem,
                    { backgroundColor: index === currentPageIndex ? theme.accent : theme.borderSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.pageMenuItemText,
                      { color: index === currentPageIndex ? theme.textInverted : theme.accentText },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
        {currentPageIndex === 0 ? (
          <Text style={[styles.readerChapterTitle, { color: theme.text }]}>{chapterTitle || `Chapter ${currentChapterIndex + 1}`}</Text>
        ) : null}
        <View onLayout={(event) => setParagraphLayout(event.nativeEvent.layout)} style={styles.readerBody}>
          {readingBlocks}
        </View>
        <View style={styles.readerPager}>
          <Pressable onPress={() => changePage(-1)} style={[styles.modeButton, styles.modeButtonInactive, { backgroundColor: theme.accentMuted }]}>
            <Text style={[styles.inactiveHeaderButtonText, { color: theme.accentText }]}>Prev</Text>
          </Pressable>
          <Pressable onPress={() => changePage(1)} style={[styles.modeButton, styles.modeButtonInactive, { backgroundColor: theme.accentMuted }]}>
            <Text style={[styles.inactiveHeaderButtonText, { color: theme.accentText }]}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.readerBottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      </View>

      {scrollbarVisible ? (
        <View pointerEvents="none" style={[styles.readerScrollbarTrack, { backgroundColor: theme.accentMuted }]}>
          <View
            style={[
              styles.readerScrollbarThumb,
              { height: scrollbarThumbHeight, transform: [{ translateY: scrollbarThumbTop }], backgroundColor: theme.accent },
            ]}
          />
        </View>
      ) : null}

      {canPositionTooltip ? (
        <Pressable onPress={closeTooltip} style={styles.tooltipLayer}>
          <View
            onLayout={(event) => setTooltipHeight(event.nativeEvent.layout.height)}
            onStartShouldSetResponder={() => true}
            style={[
              styles.tooltipCard,
              showTooltipAbove ? styles.tooltipCardAbove : styles.tooltipCardBelow,
              { left: tooltipLeft, top: tooltipTop, backgroundColor: theme.surfaceStrong },
            ]}
          >
            <Pressable hitSlop={10} onPress={closeTooltip} style={styles.tooltipCloseButton}>
              <Text style={[styles.tooltipCloseText, { color: theme.textSoft }]}>x</Text>
            </Pressable>
            <Text style={[styles.modalEyebrow, { color: theme.textSoft }]}>{selectedType === 'phrasal_verb' ? 'Selected phrase' : 'Selected word'}</Text>
            <Text style={[styles.tooltipTitle, { color: theme.text }]}>{selectedWord || 'Word'}</Text>

            {selectedMode === 'ml-kit' ? (
              <>
                <Text style={[styles.modalLabel, { color: theme.textSoft }]}>Context phrase</Text>
                <Text style={[styles.tooltipSentence, { color: theme.textMuted }]}>{selectedContext}</Text>
              </>
            ) : null}
            <Text style={[styles.modalLabel, { color: theme.textSoft }]}>{selectedMode === 'google-ai' ? 'Contextual translation' : 'Spanish translation'}</Text>
            {translationStatus === 'loading' ? (
              <Text style={[styles.modalText, { color: theme.textMuted }]}>
                {selectedMode === 'google-ai'
                  ? 'Consulting Google AI for the contextual translation...'
                  : 'Translating the selected phrase...'}
              </Text>
            ) : null}
            {translationStatus === 'success' && selectedMode === 'google-ai' ? (
              <Text style={[styles.tooltipSentence, { color: theme.textMuted }]}>{translatedWord || translatedText}</Text>
            ) : null}
            {translationStatus === 'success' && selectedMode === 'ml-kit' ? (
              <Text style={[styles.tooltipSentence, { color: theme.textMuted }]}>{translatedText}</Text>
            ) : null}
            {translationStatus === 'success' && selectedMode === 'google-ai' && analysisDetails.baseVerb ? (
              <>
                <Text style={[styles.modalLabel, { color: theme.textSoft }]}>Base verb</Text>
                <Text style={[styles.tooltipSentence, { color: theme.textMuted }]}>{analysisDetails.baseVerbMeaning ? `${analysisDetails.baseVerb}: ${analysisDetails.baseVerbMeaning}` : analysisDetails.baseVerb}</Text>
              </>
            ) : null}
            {translationStatus === 'success' && selectedMode === 'google-ai' && analysisDetails.detectedPhrasalVerb ? (
              <>
                <Text style={[styles.modalLabel, { color: theme.textSoft }]}>Phrasal verb</Text>
                <Text style={[styles.tooltipSentence, { color: theme.textMuted }]}>{analysisDetails.phrasalVerbMeaning ? `${analysisDetails.detectedPhrasalVerb}: ${analysisDetails.phrasalVerbMeaning}` : analysisDetails.detectedPhrasalVerb}</Text>
              </>
            ) : null}
            {translationStatus === 'success' && selectedMode === 'google-ai' && analysisDetails.particle ? (
              <>
                <Text style={[styles.modalLabel, { color: theme.textSoft }]}>Particle</Text>
                <Text style={[styles.tooltipSentence, { color: theme.textMuted }]}>{analysisDetails.particleContribution ? `${analysisDetails.particle}: ${analysisDetails.particleContribution}` : analysisDetails.particle}</Text>
              </>
            ) : null}
            {translationStatus === 'error' ? <Text style={[styles.modalError, { color: theme.error }]}>{translationError}</Text> : null}
          </View>
        </Pressable>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f4ede2',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f4ede2',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerStateTitle: {
    color: '#2f1b0f',
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#f4ede2',
    borderBottomWidth: 1,
    borderBottomColor: '#e1d1bf',
  },
  libraryContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 40,
  },
  libraryTopRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  libraryHeading: {
    flex: 1,
  },
  libraryBottomControls: {
    marginTop: 22,
    gap: 8,
  },
  libraryControlBlock: {
    gap: 6,
  },
  libraryControlLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  libraryFontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  libraryFontPreview: {
    flexShrink: 1,
    fontWeight: '700',
  },
  themeToggle: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  themeToggleButton: {
    minWidth: 62,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerTitle: {
    marginBottom: 10,
    color: '#2f1b0f',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chapterPickerButton: {
    minWidth: 180,
    maxWidth: '100%',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  chapterPickerButtonText: {
    color: '#5b4030',
    fontSize: 13,
    fontWeight: '800',
  },
  chapterMenu: {
    marginTop: 10,
    borderRadius: 16,
    maxHeight: 240,
    backgroundColor: '#fff7ef',
    borderWidth: 1,
    borderColor: '#e1d1bf',
    overflow: 'hidden',
  },
  chapterMenuScroll: {
    maxHeight: 240,
  },
  chapterMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#efe2d3',
  },
  chapterMenuItemActive: {
    backgroundColor: '#eadfce',
  },
  chapterMenuItemText: {
    color: '#4d382a',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  chapterMenuItemTextActive: {
    color: '#2f1b0f',
  },
  kicker: {
    marginBottom: 6,
    color: '#8b6649',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    marginBottom: 12,
    color: '#2f1b0f',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    marginBottom: 14,
    color: '#6f5b49',
    fontSize: 14,
    lineHeight: 21,
  },
  readerTopBar: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  pagePickerButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eadfce',
  },
  pagePickerButtonText: {
    color: '#6a4c37',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  pageMenu: {
    marginBottom: 12,
  },
  pageMenuContent: {
    gap: 8,
    paddingRight: 12,
  },
  pageMenuItem: {
    minWidth: 38,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#efe2d3',
  },
  pageMenuItemActive: {
    backgroundColor: '#7b4a31',
  },
  pageMenuItemText: {
    color: '#5b4030',
    fontSize: 12,
    fontWeight: '800',
  },
  pageMenuItemTextActive: {
    color: '#fffaf5',
  },
  readerChapterTitle: {
    marginBottom: 14,
    color: '#2f1b0f',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  importButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#7b4a31',
  },
  importStatus: {
    marginBottom: 10,
    color: '#48613a',
    fontSize: 14,
    lineHeight: 20,
  },
  importError: {
    marginBottom: 10,
    color: '#b33a2b',
    fontSize: 14,
    lineHeight: 20,
  },
  bookGrid: {
    gap: 14,
  },
  bookCard: {
    gap: 12,
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#fff7ef',
    borderWidth: 1,
    borderColor: '#e1d1bf',
  },
  bookCardMain: {
    flexDirection: 'row',
    gap: 14,
  },
  bookCover: {
    width: 72,
    height: 104,
    borderRadius: 12,
    backgroundColor: '#d8cab8',
  },
  bookCoverFallback: {
    width: 72,
    height: 104,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbc8b1',
  },
  bookCoverFallbackText: {
    color: '#6b4b34',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bookMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    marginBottom: 6,
    color: '#2f1b0f',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  bookSource: {
    marginBottom: 8,
    color: '#7a614d',
    fontSize: 14,
    lineHeight: 20,
  },
  bookProgress: {
    color: '#9a7455',
    fontSize: 13,
    lineHeight: 18,
  },
  deleteBookButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f1ddd3',
  },
  deleteBookButtonText: {
    color: '#8d3d2f',
    fontSize: 12,
    fontWeight: '800',
  },
  readerBody: {
    paddingBottom: 16,
  },
  readerPager: {
    marginTop: 4,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  readerBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 0,
  },
  readerScrollbarTrack: {
    position: 'absolute',
    top: 128,
    right: 6,
    bottom: 18,
    width: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(117, 88, 62, 0.14)',
  },
  readerScrollbarThumb: {
    width: 6,
    borderRadius: 999,
    backgroundColor: '#7b4a31',
  },
  paragraphBlock: {
    marginBottom: 14,
  },
  imageBlock: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#efe2d3',
  },
  inlineImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#efe2d3',
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  bodyText: {
    color: '#47362a',
    fontSize: 16,
    lineHeight: 25,
  },
  subheadText: {
    color: '#2f1b0f',
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '700',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-bold' : undefined,
  },
  word: {
    color: '#24150d',
    fontSize: 16,
    lineHeight: 25,
  },
  subheadWord: {
    color: '#2f1b0f',
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '700',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-bold' : undefined,
  },
  referenceText: {
    color: '#8b6649',
    fontSize: 10,
    lineHeight: 16,
  },
  phrasalWord: {
    textDecorationLine: 'underline',
    textDecorationColor: '#b88754',
  },
  modeButton: {
    minWidth: 84,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#7b4a31',
  },
  modeButtonInactive: {
    backgroundColor: '#eadfce',
  },
  primaryButtonText: {
    color: '#fffaf5',
    fontSize: 13,
    fontWeight: '800',
  },
  inactiveHeaderButtonText: {
    color: '#5b4030',
    fontSize: 13,
    fontWeight: '800',
  },
  tooltipLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tooltipCard: {
    position: 'absolute',
    width: TOOLTIP_WIDTH,
    borderRadius: 18,
    paddingTop: 14,
    paddingRight: 18,
    paddingBottom: 16,
    paddingLeft: 18,
    backgroundColor: '#fff9f3',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tooltipCardAbove: {
    borderBottomRightRadius: 8,
  },
  tooltipCardBelow: {
    borderTopRightRadius: 8,
  },
  tooltipCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipCloseText: {
    color: '#8a6548',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  modalEyebrow: {
    marginBottom: 8,
    color: '#8a6548',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tooltipTitle: {
    marginBottom: 14,
    color: '#2f1b0f',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  modalLabel: {
    marginBottom: 6,
    color: '#8a6548',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tooltipSentence: {
    marginBottom: 14,
    color: '#3f2f25',
    fontSize: 15,
    lineHeight: 22,
  },
  modalText: {
    marginBottom: 16,
    color: '#654f40',
    fontSize: 15,
    lineHeight: 22,
  },
  modalError: {
    marginBottom: 16,
    color: '#b33a2b',
    fontSize: 15,
    lineHeight: 22,
  },
})
