import { useMemo, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import TranslateText, { TranslateLanguage } from '@react-native-ml-kit/translate-text'

const readingText = `On quiet mornings, Emma liked to sit near the window and read one chapter before the city fully woke up. The soft light touched the pages, the coffee slowly cooled beside her, and every paragraph felt like an open door to another life.

She loved the way stories made ordinary moments feel larger. A simple train ride became an adventure. A short conversation became a secret. A rainy afternoon became the beginning of a memory worth keeping.

One day, while reading in English, she noticed how powerful a single word could be. Some words sounded warm, some felt sharp, and others carried entire emotions inside them. She began tapping each unfamiliar word in her notebook, repeating it until it started to belong to her.

That small habit changed the way she learned. Reading was no longer only about finishing a page. It became a slow and personal dialogue with language, one word at a time.

The room stayed silent except for the turning of pages and the distant sound of traffic outside. Emma underlined expressions she liked, circled verbs she wanted to remember, and smiled whenever a sentence felt clear without translation.

Some days she moved quickly, almost flying through the lines. On other days she paused after every few words, letting them settle in her mind. Both rhythms mattered, because both were part of learning how to read with patience and attention.`

const sentenceMatches = readingText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []

function getWordValue(token) {
  return token.replace(/[^A-Za-z'-]/g, '')
}

function buildContextSnippet(sentence, wordIndex, radius = 2) {
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
  const endWordIndex = Math.min(words.length - 1, wordIndex + radius)
  const startTokenIndex = words[startWordIndex].tokenIndex
  const endTokenIndex = words[endWordIndex].tokenIndex

  return sentenceTokens.slice(startTokenIndex, endTokenIndex + 1).join('').trim()
}

function buildReadingItems() {
  const items = []

  sentenceMatches.forEach((sentence, sentenceIndex) => {
    const sentenceText = sentence.trim()
    const sentenceTokens = sentence.split(/(\s+)/)
    let wordIndexInSentence = 0

    sentenceTokens.forEach((token, tokenIndex) => {
      const word = getWordValue(token)

      items.push({
        id: `${sentenceIndex}-${tokenIndex}`,
        token,
        sentence: sentenceText,
        word,
        wordIndexInSentence: word ? wordIndexInSentence : -1,
      })

      if (word) {
        wordIndexInSentence += 1
      }
    })
  })

  return items
}

const readingItems = buildReadingItems()

export default function App() {
  const [selectedMode, setSelectedMode] = useState('ml-kit')
  const [selectedWord, setSelectedWord] = useState('')
  const [selectedContext, setSelectedContext] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [translationStatus, setTranslationStatus] = useState('idle')
  const [translationError, setTranslationError] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)

  const readingTokens = useMemo(
    () =>
      readingItems.map((item) => {
        if (!item.word) {
          return (
            <Text key={item.id} style={styles.bodyText}>
              {item.token}
            </Text>
          )
        }

        return (
          <Pressable key={item.id} onPress={() => handleWordPress(item)}>
            <Text style={styles.word}>{item.token}</Text>
          </Pressable>
        )
      }),
    [selectedMode],
  )

  async function handleWordPress(item) {
    const contextSnippet = buildContextSnippet(item.sentence, item.wordIndexInSentence)

    setSelectedWord(item.word)
    setSelectedContext(contextSnippet)
    setTranslatedText('')
    setTranslationError('')
    setIsModalVisible(true)

    if (selectedMode !== 'ml-kit') {
      setTranslationStatus('error')
      setTranslationError('OpenAI mode is not implemented yet.')
      return
    }

    setTranslationStatus('loading')

    try {
      const result = await TranslateText.translate({
        text: contextSnippet,
        sourceLanguage: TranslateLanguage.ENGLISH,
        targetLanguage: TranslateLanguage.SPANISH,
        downloadModelIfNeeded: true,
      })

      const translatedValue = typeof result === 'string' ? result : String(result ?? '')
      setTranslatedText(translatedValue)
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

  function closeModal() {
    setIsModalVisible(false)
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Text style={styles.kicker}>BookApp</Text>
        <Text style={styles.headerTitle}>Choose Translation Mode</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={[styles.modeButton, selectedMode === 'ml-kit' ? styles.modeButtonActive : styles.modeButtonInactive]}
            onPress={() => setSelectedMode('ml-kit')}
          >
            <Text
              style={selectedMode === 'ml-kit' ? styles.primaryButtonText : styles.inactiveHeaderButtonText}
            >
              ML Kit
            </Text>
          </Pressable>

          <Pressable
            style={[styles.modeButton, selectedMode === 'openai' ? styles.modeButtonActive : styles.modeButtonInactive]}
            onPress={() => setSelectedMode('openai')}
          >
            <Text
              style={selectedMode === 'openai' ? styles.primaryButtonText : styles.inactiveHeaderButtonText}
            >
              OpenAI
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  function renderContent() {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.screen}>
        <Text style={styles.kicker}>Reading Mode</Text>
        <Text style={styles.title}>Touch any word</Text>
        <Text style={styles.subtitle}>
          The text stays the same. The selected mode only changes how the translation is resolved
          after you tap a word.
        </Text>
        <View style={styles.paragraph}>{readingTokens}</View>
      </ScrollView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {renderHeader()}
      {renderContent()}

      <Modal animationType="fade" transparent visible={isModalVisible} onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>Selected word</Text>
            <Text style={styles.modalTitle}>{selectedWord || 'Word'}</Text>

            <Text style={styles.modalLabel}>Context phrase</Text>
            <Text style={styles.modalSentence}>{selectedContext}</Text>

            <Text style={styles.modalLabel}>Spanish translation</Text>
            {translationStatus === 'loading' ? (
              <Text style={styles.modalText}>Translating the selected phrase...</Text>
            ) : null}
            {translationStatus === 'success' ? (
              <Text style={styles.modalSentence}>{translatedText}</Text>
            ) : null}
            {translationStatus === 'error' ? (
              <Text style={styles.modalError}>{translationError}</Text>
            ) : null}

            <Pressable style={styles.primaryButton} onPress={closeModal}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4ede2',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f4ede2',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#f4ede2',
    borderBottomWidth: 1,
    borderBottomColor: '#e1d1bf',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 40,
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
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    marginBottom: 28,
    color: '#6f5b49',
    fontSize: 16,
    lineHeight: 24,
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  bodyText: {
    color: '#47362a',
    fontSize: 22,
    lineHeight: 38,
  },
  word: {
    color: '#24150d',
    fontSize: 22,
    lineHeight: 38,
  },
  primaryButton: {
    marginBottom: 14,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7b4a31',
  },
  modeButton: {
    minWidth: 110,
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
  modalBackdrop: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 24, 14, 0.45)',
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#fff9f3',
  },
  modalEyebrow: {
    marginBottom: 8,
    color: '#8a6548',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalTitle: {
    marginBottom: 14,
    color: '#2f1b0f',
    fontSize: 28,
    fontWeight: '800',
  },
  modalLabel: {
    marginBottom: 6,
    color: '#8a6548',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalSentence: {
    marginBottom: 16,
    color: '#3f2f25',
    fontSize: 18,
    lineHeight: 28,
  },
  modalText: {
    marginBottom: 16,
    color: '#654f40',
    fontSize: 16,
    lineHeight: 24,
  },
  modalError: {
    marginBottom: 16,
    color: '#b33a2b',
    fontSize: 15,
    lineHeight: 22,
  },
})
