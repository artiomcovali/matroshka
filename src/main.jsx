import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowLeft, ArrowRight, AudioLines, BookOpen, Bookmark, Check, CheckCircle2,
  ChevronDown, ChevronRight, CircleHelp, Compass, Flame, Globe2, GraduationCap,
  Headphones, Heart, Home, LibraryBig, Lightbulb, ListChecks, MessageCircle,
  PencilLine, Play, Quote, RotateCcw, Search, SlidersHorizontal, Sparkles,
  Star, Volume2, X,
} from 'lucide-react'
import './styles.css'

const LEVELS = ['All levels', 'A1', 'A2', 'A2Plus', 'B1', 'B2', 'C1']
const CATEGORIES = [
  { name: 'Stories', label: 'Stories', icon: BookOpen, tone: 'rose', intro: 'Learn through little worlds' },
  { name: 'Culture', label: 'Culture', icon: Globe2, tone: 'sky', intro: 'Explore Russia beyond words' },
  { name: 'Idioms', label: 'Idioms', icon: Quote, tone: 'lilac', intro: 'Say it like you mean it' },
  { name: 'Slang', label: 'Slang', icon: Sparkles, tone: 'yellow', intro: 'Words you hear in real life' },
  { name: 'Grammar', label: 'Grammar', icon: GraduationCap, tone: 'mint', intro: 'Make it all click' },
  { name: 'Shadowing', label: 'Pronunciation', icon: AudioLines, tone: 'peach', intro: 'Find your Russian rhythm' },
  { name: 'Writing', label: 'Writing', icon: PencilLine, tone: 'sky', intro: 'Put your thoughts into words' },
  { name: 'Missions', label: 'Missions', icon: Compass, tone: 'rose', intro: 'Practice everyday situations' },
  { name: 'Chats', label: 'Conversations', icon: MessageCircle, tone: 'lilac', intro: 'Get ready to speak' },
  { name: 'Tests', label: 'Tests', icon: ListChecks, tone: 'yellow', intro: 'See what you know' },
  { name: 'Conjugation', label: 'Verbs', icon: RotateCcw, tone: 'mint', intro: 'A handy verb reference' },
  { name: 'Declension', label: 'Nouns', icon: LibraryBig, tone: 'peach', intro: 'Cases, made clearer' },
  { name: 'Reading', label: 'Reading', icon: BookOpen, tone: 'sky', intro: 'More to read and explore' },
]
const byCategory = Object.fromEntries(CATEGORIES.map(item => [item.name, item]))
const starterPicks = ['Stories:a1-001', 'Culture:culture-baikal-a2', 'Idioms:idioms-001', 'Slang:slang-b2-mini-001']

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function writeStore(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function safeText(value) { return typeof value === 'string' ? value : '' }
function prettyLevel(level) { return level === 'A2Plus' ? 'A2+' : level || 'All levels' }
function cleanWord(word) { return word.toLocaleLowerCase('ru-RU').replace(/[^\p{L}ёЁ-]/gu, '') }

function DollMark({ small = false }) {
  return <svg className={small ? 'doll-mark small' : 'doll-mark'} viewBox="0 0 82 100" role="img" aria-label="Matroshka nesting doll">
    <path d="M41 5C25 5 17 19 17 34c0 9 3 15 7 20C13 64 9 77 9 88c0 5 3 8 8 8h48c5 0 8-3 8-8 0-11-4-24-15-34 4-5 7-11 7-20C65 19 57 5 41 5Z" fill="#D24C3F" stroke="#922D2B" strokeWidth="2"/>
    <path d="M41 13c-10 0-17 9-17 21 0 4 1 7 3 10 3-11 11-17 14-17s11 6 14 17c2-3 3-6 3-10 0-12-7-21-17-21Z" fill="#163C46"/>
    <ellipse cx="41" cy="39" rx="13" ry="14" fill="#FFE3BA"/><circle cx="36" cy="39" r="1.5" fill="#27353B"/><circle cx="46" cy="39" r="1.5" fill="#27353B"/>
    <path d="M37 45c2.5 2 5.5 2 8 0" stroke="#B75348" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M20 83c3-17 10-27 21-27s18 10 21 27" fill="#F3A55E"/>
    <path d="M33 70c-6 4-7 9-3 13 4 4 8 1 11-2 3 3 7 6 11 2 4-4 3-9-3-13-4-3-7-2-8 2-1-4-4-5-8-2Z" fill="#F7E7BE" stroke="#A5453B" strokeWidth="1.5"/>
    <circle cx="41" cy="77" r="5" fill="#D6534B"/><circle cx="41" cy="77" r="2" fill="#F9C86A"/>
  </svg>
}

function HeroArt() {
  return <div className="hero-art" aria-hidden="true"><span className="hero-sun"/><span className="hero-arch arch-one"/><span className="hero-arch arch-two"/><div className="doll big"><DollMark /></div><div className="doll little"><DollMark /></div><span className="hero-star star-one">✳</span><span className="hero-star star-two">✦</span><span className="hero-flower">✿</span></div>
}

function CategoryIcon({ category, size = 22 }) {
  const item = byCategory[category] || CATEGORIES[0]
  const Icon = item.icon
  return <span className={`category-icon tone-${item.tone}`}><Icon size={size} strokeWidth={2} /></span>
}

function ProgressBar({ value = 0, max = 1 }) {
  return <div className="progress-track"><div style={{ width: `${Math.min(100, Math.max(0, value / Math.max(max, 1) * 100))}%` }} /></div>
}

function App() {
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('home')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState('All levels')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [completed, setCompleted] = useState(() => readStore('matroshka.completed', {}))
  const [saved, setSaved] = useState(() => readStore('matroshka.saved', {}))
  const [last, setLast] = useState(() => readStore('matroshka.last', null))
  const [dictionary, setDictionary] = useState(null)
  const [lookup, setLookup] = useState(null)

  useEffect(() => {
    fetch('/data/catalog.json').then(response => { if (!response.ok) throw new Error('The lesson catalog could not load.'); return response.json() })
      .then(data => { setCatalog(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => { writeStore('matroshka.completed', completed) }, [completed])
  useEffect(() => { writeStore('matroshka.saved', saved) }, [saved])
  useEffect(() => { writeStore('matroshka.last', last) }, [last])

  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map(item => [item.name, catalog.filter(entry => entry.category === item.name).length])), [catalog])
  const filtered = useMemo(() => catalog.filter(item =>
    (category === 'All' || item.category === category) &&
    (level === 'All levels' || item.level === level) &&
    (!query.trim() || `${item.title} ${item.titleEnglish} ${item.id} ${item.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  ), [catalog, category, level, query])

  function goLibrary(nextCategory = 'All') {
    setCategory(nextCategory); setLevel('All levels'); setQuery(''); setPage(1); setView('library'); setSelected(null); window.scrollTo(0, 0)
  }
  async function openLesson(item) {
    setSelected(item); setLesson(null); setLessonLoading(true); setLookup(null); setView('lesson'); setLast(item.key); window.scrollTo(0, 0)
    try { const response = await fetch(item.path); if (!response.ok) throw new Error('This lesson could not load.'); setLesson(await response.json()); setError('') }
    catch (err) { setError(err.message) }
    finally { setLessonLoading(false) }
  }
  function markComplete() { if (selected) setCompleted(previous => ({ ...previous, [selected.key]: Date.now() })) }
  function toggleSaved() { if (selected) setSaved(previous => { const next = { ...previous }; if (next[selected.key]) delete next[selected.key]; else next[selected.key] = true; return next }) }
  async function lookupWord(word, translations = {}) {
    const normalized = cleanWord(word)
    if (!normalized) return
    let local = dictionary
    if (!local) { try { local = await (await fetch('/data/dictionary.json')).json(); setDictionary(local) } catch { local = {} } }
    const translation = translations[word] || translations[normalized] || local[normalized] || local[normalized.replace(/ё/g, 'е')] || 'No local translation found'
    setLookup({ word, translation })
  }

  const lastItem = catalog.find(item => item.key === last)
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => { setView('home'); setSelected(null); window.scrollTo(0, 0) }}><DollMark small /><span>Matroshka<small>LEARN RUSSIAN</small></span></button>
      <div className="nav-label">EXPLORE</div>
      <nav className="side-nav">
        <button className={view === 'home' ? 'active' : ''} onClick={() => { setView('home'); setSelected(null) }}><Home size={19} /> Home</button>
        <button className={view === 'library' && category === 'All' ? 'active' : ''} onClick={() => goLibrary()}><LibraryBig size={19} /> Library <span className="nav-count">{catalog.length}</span></button>
        {CATEGORIES.slice(0, 9).map(item => <button key={item.name} className={view === 'library' && category === item.name ? 'active' : ''} onClick={() => goLibrary(item.name)}><item.icon size={19} /> {item.label}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="free-note"><Sparkles size={18} /><strong>Every lesson is yours.</strong><span>Open, free, and ready whenever you are.</span></div><span className="sidebar-foot">Made for curious minds ✳</span></div>
    </aside>

    <div className="main-area">
      <header className="topbar"><button className="mobile-brand" onClick={() => setView('home')}><DollMark small /> Matroshka</button><div className="topbar-left">{view === 'home' ? 'Your Russian journey' : view === 'library' ? 'Explore the library' : selected?.category || 'Matroshka'}</div><div className="topbar-actions"><span className="free-pill"><Heart size={14} fill="currentColor" /> Always free</span><span className="avatar">M</span></div></header>
      <main className="content">
        {loading && <div className="loading-screen"><DollMark /><p>Opening the library...</p></div>}
        {!loading && error && !lessonLoading && <div className="error-note">{error}<button onClick={() => window.location.reload()}>Try again</button></div>}
        {!loading && view === 'home' && <>
          <section className="welcome-row"><div><div className="eyebrow"><SunIcon /> Здравствуй, friend!</div><h1>One layer at a time,<br /><em>Russian comes alive.</em></h1><p>Real stories, everyday language, and a little discovery in every lesson.</p></div><div className="header-stats"><span><Flame size={19} /> Your journey</span><strong>{Object.keys(completed).length}</strong><small>lessons completed</small></div></section>
          <section className="hero-card"><div className="hero-copy"><span className="hero-kicker"><span className="hero-dot" /> YOUR NEXT CHAPTER</span><h2>Little stories.<br />Big discoveries.</h2><p>Start with a story, meet the words, listen along, and see what you remember.</p><button className="button light" onClick={() => openLesson(lastItem || catalog.find(item => item.key === 'Stories:a1-001'))}>{lastItem ? 'Continue learning' : 'Start your first story'} <ArrowRight size={18} /></button><span className="hero-caption">228 stories · A1 to C1 · all free</span></div><HeroArt /></section>
          <div className="section-heading"><div><span className="eyebrow muted">PICK YOUR PATH</span><h2>What sounds good today?</h2></div><button className="text-button" onClick={() => goLibrary()}>See everything <ArrowRight size={17} /></button></div>
          <div className="category-grid">{CATEGORIES.slice(0, 8).map(item => <button key={item.name} className={`category-card tone-${item.tone}`} onClick={() => goLibrary(item.name)}><CategoryIcon category={item.name} size={23} /><span className="category-card-arrow"><ArrowRight size={18} /></span><strong>{item.label}</strong><small>{item.intro}</small><span className="category-count">{counts[item.name]} lessons</span></button>)}</div>
          <div className="section-heading featured-heading"><div><span className="eyebrow muted">A GOOD PLACE TO BEGIN</span><h2>Handpicked for you</h2></div></div>
          <div className="featured-grid">{starterPicks.map((key, index) => { const item = catalog.find(entry => entry.key === key); return item ? <LessonCard key={key} item={item} index={index} complete={Boolean(completed[item.key])} onClick={() => openLesson(item)} /> : null })}</div>
        </>}
        {!loading && view === 'library' && <>
          <div className="library-hero"><div><span className="eyebrow muted">THE WHOLE WORLD IS OPEN</span><h1>{category === 'All' ? 'Find your next little adventure.' : byCategory[category]?.label}</h1><p>{category === 'All' ? 'Explore every story, expression, grammar lesson, and practice activity.' : byCategory[category]?.intro}</p></div><div className="library-doll"><DollMark /></div></div>
          <div className="filter-panel"><div className="search-box"><Search size={19} /><input aria-label="Search lessons" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder="Search titles, topics, or Russian words..." />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}</div><div className="select-wrap"><SlidersHorizontal size={18} /><select value={level} onChange={event => { setLevel(event.target.value); setPage(1) }} aria-label="Level">{LEVELS.map(value => <option key={value} value={value}>{prettyLevel(value)}</option>)}</select><ChevronDown size={16} /></div></div>
          <div className="category-tabs"><button className={category === 'All' ? 'selected' : ''} onClick={() => { setCategory('All'); setPage(1) }}>All <span>{catalog.length}</span></button>{CATEGORIES.map(item => <button key={item.name} className={category === item.name ? 'selected' : ''} onClick={() => { setCategory(item.name); setPage(1) }}>{item.label} <span>{counts[item.name]}</span></button>)}</div>
          <div className="results-heading"><div><h2>{category === 'All' ? 'All lessons' : byCategory[category]?.label}</h2><span>{filtered.length} {filtered.length === 1 ? 'lesson' : 'lessons'} to explore</span></div></div>
          {filtered.length ? <><div className="lesson-grid">{filtered.slice(0, page * 24).map((item, index) => <LessonCard key={item.key} item={item} index={index} complete={Boolean(completed[item.key])} onClick={() => openLesson(item)} />)}</div>{filtered.length > page * 24 && <button className="button load-more" onClick={() => setPage(page + 1)}>Show more lessons <ArrowRight size={17} /></button>}</> : <div className="empty-state"><Search size={30} /><h3>No lessons found</h3><p>Try another word, category, or level.</p><button className="button" onClick={() => { setQuery(''); setCategory('All'); setLevel('All levels') }}>Clear filters</button></div>}
        </>}
        {!loading && view === 'lesson' && <>
          <button className="back-link" onClick={() => goLibrary(selected?.category || 'All')}><ArrowLeft size={17} /> Back to {byCategory[selected?.category]?.label || 'library'}</button>
          {lessonLoading ? <div className="loading-screen"><DollMark /><p>Opening your lesson...</p></div> : lesson && selected ? <LessonPage key={selected.key} item={selected} lesson={lesson} isComplete={Boolean(completed[selected.key])} isSaved={Boolean(saved[selected.key])} onComplete={markComplete} onSave={toggleSaved} onLookup={lookupWord} lookup={lookup} onCloseLookup={() => setLookup(null)} onExplore={() => goLibrary(selected.category)} /> : null}
        </>}
      </main>
      <footer className="main-footer"><span>Matroshka © 2026</span><span>Learn freely. Stay curious. ♡</span></footer>
    </div>
    <nav className="mobile-nav"><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><Home size={20} />Home</button><button className={view === 'library' ? 'active' : ''} onClick={() => goLibrary()}><Compass size={20} />Explore</button><button className={view === 'library' && category === 'Stories' ? 'active' : ''} onClick={() => goLibrary('Stories')}><BookOpen size={20} />Stories</button><button onClick={() => goLibrary('Grammar')}><GraduationCap size={20} />Grammar</button></nav>
  </div>
}

function SunIcon() { return <span className="sun-glyph">✳</span> }

function LessonCard({ item, index, complete, onClick }) {
  const palette = ['rose', 'sky', 'lilac', 'yellow', 'mint', 'peach']
  const tone = byCategory[item.category]?.tone || palette[index % palette.length]
  const Icon = byCategory[item.category]?.icon || BookOpen
  return <button className="lesson-card" onClick={onClick}><div className={`lesson-art tone-${tone}`}><span className="lesson-art-orbit"/><Icon size={43} strokeWidth={1.45} /><span className="lesson-art-spark">✳</span>{complete && <span className="complete-badge"><Check size={15} /></span>}</div><div className="lesson-info"><div className="lesson-meta"><span>{byCategory[item.category]?.label || item.category}</span>{item.level && <span>{prettyLevel(item.level)}</span>}</div><h3>{item.title}</h3>{item.titleEnglish && item.titleEnglish !== item.title && <p className="translation-title">{item.titleEnglish}</p>}<div className="lesson-foot"><span>{item.practice ? 'Practice set' : item.hasText ? 'Read & practice' : 'Explore lesson'}</span><ArrowRight size={17} /></div></div></button>
}

function normalizeQuestions(lesson) {
  const sources = [lesson.quiz, lesson.multipleChoice, lesson.comprehension]
  if (Array.isArray(lesson.questions)) {
    sources.push(lesson.questions.flatMap(group => Array.isArray(group.items) ? group.items : group))
  }
  if (Array.isArray(lesson.sets)) {
    sources.push(lesson.sets.flatMap(set => (set.questions || []).flatMap(group => Array.isArray(group.items) ? group.items : group)))
  }
  const questions = sources.flatMap(source => Array.isArray(source) ? source : []).map(question => {
    if (!question || !Array.isArray(question.options) || !question.options.length) return null
    const index = Number.isInteger(question.correctIndex) ? question.correctIndex : question.options.indexOf(question.answer)
    if (index < 0 || index >= question.options.length) return null
    return { prompt: question.prompt || question.question || '', options: question.options, correctIndex: index, explanation: question.explanation || '', hint: question.hint || '' }
  }).filter(Boolean)
  if (Array.isArray(lesson.trueFalse)) for (const item of lesson.trueFalse) questions.push({ prompt: item.statement, options: ['True', 'False'], correctIndex: item.isTrue ? 0 : 1, explanation: item.explanation || '' })
  return questions
}

function LessonPage({ item, lesson, isComplete, isSaved, onComplete, onSave, onLookup, lookup, onCloseLookup, onExplore }) {
  const isNarrative = typeof lesson.fullText === 'string' && lesson.fullText.length > 0
  const words = Array.isArray(lesson.reviewVocab) && lesson.reviewVocab.length ? lesson.reviewVocab
    : lesson.slangWord ? [{ word: lesson.slangWord, definition: lesson.slangDefinition }]
      : Array.isArray(lesson.idioms) ? lesson.idioms.map(idiom => ({ word: idiom.russian, definition: idiom.english, russianDefinition: idiom.usage })) : []
  const questions = useMemo(() => normalizeQuestions(lesson), [lesson])
  const [step, setStep] = useState(isNarrative ? (words.length ? 'words' : 'read') : 'explore')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [fontSize, setFontSize] = useState(20)
  const [currentWord, setCurrentWord] = useState('')
  const [timings, setTimings] = useState([])
  const [showAnswer, setShowAnswer] = useState(false)
  const audioPath = item.audioFile ? `/assets/Content/${item.category}/Audio/${item.audioFile}` : null

  useEffect(() => {
    if (!lesson.audioTimingFile) return
    fetch(`/assets/Content/${item.category}/Audio/${lesson.audioTimingFile}`).then(response => response.json()).then(value => setTimings(Array.isArray(value.words) ? value.words : [])).catch(() => {})
  }, [item.category, lesson.audioTimingFile])
  const hasPractice = Boolean(lesson.fillInBlank || lesson.grammarQuiz?.length || lesson.sentenceReorder || lesson.pairing || lesson.writing?.sentences?.length || lesson.situations?.length || lesson.usageCheck?.length)
  const steps = isNarrative ? [words.length && 'words', 'read', questions.length && 'quiz', hasPractice && 'practice', 'done'].filter(Boolean) : ['explore']
  function nextStep() { const index = steps.indexOf(step); if (index < steps.length - 1) { const next = steps[index + 1]; setStep(next); if (next === 'done') onComplete(); window.scrollTo({ top: 0, behavior: 'smooth' }) } }
  function restart() { setStep(words.length ? 'words' : 'read'); setQuestionIndex(0); setChosen(null); setCorrect(0); window.scrollTo(0, 0) }
  function nextQuestion() { if (chosen === questions[questionIndex].correctIndex) setCorrect(value => value + 1); setChosen(null); if (questionIndex + 1 < questions.length) setQuestionIndex(value => value + 1); else nextStep() }
  function onAudioTime(event) { if (!timings.length) return; const seconds = event.currentTarget.currentTime; const match = timings.find(word => seconds >= (word.start ?? word.startTime ?? 0) && seconds < (word.end ?? word.endTime ?? 0)); setCurrentWord(match?.text || match?.word || '') }
  const Icon = byCategory[item.category]?.icon || BookOpen
  return <div className="lesson-page">
    <div className="lesson-title-row"><div><div className="lesson-breadcrumb"><span>{byCategory[item.category]?.label || item.category}</span><ChevronRight size={13} /><span>{prettyLevel(item.level)}</span></div><h1>{item.title}</h1>{item.titleEnglish && item.titleEnglish !== item.title && <p>{item.titleEnglish}</p>}</div><button className={isSaved ? 'save-button saved' : 'save-button'} onClick={onSave} aria-label={isSaved ? 'Remove bookmark' : 'Bookmark lesson'}><Bookmark size={19} fill={isSaved ? 'currentColor' : 'none'} /></button></div>
    {isNarrative ? <>
      <div className="stepper">{steps.map((name, index) => <button key={name} className={`${step === name ? 'current' : ''} ${steps.indexOf(step) > index ? 'passed' : ''}`} onClick={() => { if (index <= steps.indexOf(step)) setStep(name) }}><span>{steps.indexOf(step) > index ? <Check size={14} /> : index + 1}</span>{({ words: 'Words', read: 'Read', quiz: 'Quiz', practice: 'Practice', done: 'Done' })[name]}</button>)}</div>
      <div className="lesson-layout"><div className="lesson-main">
        {step === 'words' && <section className="stage-card"><div className="stage-eyebrow"><Lightbulb size={17} /> BEFORE YOU READ</div><h2>Meet the important words</h2><p className="stage-intro">A few words to keep an eye out for in this lesson.</p><div className="word-grid">{words.map((word, index) => <div key={index} className="word-card"><span className="word-number">{String(index + 1).padStart(2, '0')}</span><strong>{word.word || word.russian}</strong><span>{word.definition || word.english}</span>{word.partOfSpeech && <small>{word.partOfSpeech}</small>}{word.russianDefinition && <small>{word.russianDefinition}</small>}</div>)}</div><button className="button primary stage-action" onClick={nextStep}>I'm ready to read <ArrowRight size={18} /></button></section>}
        {step === 'read' && <section className="stage-card reading-card"><div className="stage-eyebrow"><BookOpen size={17} /> THE STORY</div><div className="reading-heading"><div><h2>{item.title}</h2><span>Tap any word for a local translation</span></div><div className="font-actions"><button aria-label="Decrease text size" onClick={() => setFontSize(Math.max(16, fontSize - 2))}>A−</button><button aria-label="Increase text size" onClick={() => setFontSize(Math.min(28, fontSize + 2))}>A+</button></div></div>{audioPath && <div className="audio-player"><span className="audio-icon"><Headphones size={21} /></span><div><strong>Listen along</strong><small>{currentWord || 'Follow the story at your own pace'}</small></div><audio controls preload="none" src={audioPath} onTimeUpdate={onAudioTime} aria-label="Lesson audio" /></div>}<div className="story-body" style={{ fontSize: `${fontSize}px` }}>{lesson.fullText.split(/([\p{L}ёЁ-]+)/u).map((part, index) => /[\p{L}ёЁ]/u.test(part) ? <button className="reader-word" key={index} onClick={() => onLookup(part, lesson.translations || {})}>{part}</button> : <React.Fragment key={index}>{part}</React.Fragment>)}</div>{lookup && <div className="word-popup"><div><span>RUSSIAN WORD</span><strong>{lookup.word}</strong><p>{lookup.translation}</p></div><button aria-label="Close translation" onClick={onCloseLookup}><X size={18} /></button></div>}<button className="button primary stage-action" onClick={nextStep}>{questions.length ? 'Ready for the quiz' : hasPractice ? 'Continue to practice' : 'Finish lesson'} <ArrowRight size={18} /></button></section>}
        {step === 'quiz' && questions[questionIndex] && <section className="stage-card quiz-card"><div className="stage-eyebrow"><CircleHelp size={17} /> AFTER YOU READ</div><div className="quiz-top"><h2>What do you remember?</h2><span>{questionIndex + 1} of {questions.length}</span></div><ProgressBar value={questionIndex + 1} max={questions.length} /><div className="question-prompt">{questions[questionIndex].prompt}</div><div className="options">{questions[questionIndex].options.map((option, index) => <button key={index} className={`${chosen === index ? 'chosen' : ''} ${chosen !== null && index === questions[questionIndex].correctIndex ? 'correct' : ''} ${chosen === index && index !== questions[questionIndex].correctIndex ? 'incorrect' : ''}`} disabled={chosen !== null} onClick={() => setChosen(index)}><span>{String.fromCharCode(65 + index)}</span>{String(option)}{chosen !== null && index === questions[questionIndex].correctIndex && <CheckCircle2 size={20} />}</button>)}</div>{chosen !== null && <div className={chosen === questions[questionIndex].correctIndex ? 'feedback good' : 'feedback'}><strong>{chosen === questions[questionIndex].correctIndex ? 'Exactly right!' : 'Keep going — you’re learning.'}</strong><span>{questions[questionIndex].explanation || `The answer is ${questions[questionIndex].options[questions[questionIndex].correctIndex]}.`}</span></div>}{chosen !== null && <button className="button primary stage-action" onClick={nextQuestion}>{questionIndex + 1 === questions.length ? 'Continue' : 'Next question'} <ArrowRight size={18} /></button>}</section>}
        {step === 'practice' && <section className="stage-card"><div className="stage-eyebrow"><Sparkles size={17} /> A LITTLE MORE PRACTICE</div><h2>Make it stick</h2><p className="stage-intro">Try the extra exercises packed with this lesson.</p><PracticeSections lesson={lesson} /><button className="button primary stage-action" onClick={nextStep}>Finish lesson <ArrowRight size={18} /></button></section>}
        {step === 'done' && <section className="stage-card done-card"><div className="done-medal"><Star size={35} fill="currentColor" /></div><span className="stage-eyebrow">LESSON COMPLETE</span><h2>Красота! You did it.</h2><p>Another layer of Russian is yours. Come back whenever you like — everything here stays free.</p>{questions.length > 0 && <div className="score-card"><strong>{correct} / {questions.length}</strong><span>quiz questions right</span></div>}<div className="done-actions"><button className="button primary" onClick={restart}><RotateCcw size={17} /> Practice again</button><button className="button secondary" onClick={onExplore}>Keep exploring <ArrowRight size={17} /></button></div></section>}
      </div><aside className="lesson-aside"><div className={`aside-art tone-${byCategory[item.category]?.tone || 'rose'}`}><Icon size={62} strokeWidth={1.4} /><span>✳</span></div><div className="aside-panel"><span className="aside-kicker">AT A GLANCE</span><div><BookOpen size={18} /><span>{item.hasText ? 'Story-based lesson' : 'Practice lesson'}</span></div>{item.level && <div><GraduationCap size={18} /><span>Level {prettyLevel(item.level)}</span></div>}{audioPath && <div><Headphones size={18} /><span>Audio included</span></div>}<div><Heart size={18} /><span>100% free</span></div></div></aside></div>
    </> : <StructuredLesson key={item.key} item={item} lesson={lesson} questions={questions} isComplete={isComplete} onComplete={onComplete} />}
  </div>
}

function PracticeSections({ lesson }) {
  const [shown, setShown] = useState({})
  const sections = []
  if (lesson.fillInBlank?.blanks?.length) sections.push({ title: 'Fill in the blanks', icon: PencilLine, content: <div className="practice-list">{lesson.fillInBlank.blanks.map((blank, i) => <div key={i}><p>{blank}</p><button onClick={() => setShown(previous => ({ ...previous, [`fib${i}`]: !previous[`fib${i}`] }))}>{shown[`fib${i}`] ? `Answer: ${lesson.fillInBlank.answers?.[i]}` : 'Show answer'}</button></div>)}</div> })
  if (lesson.grammarQuiz?.length) sections.push({ title: 'Grammar check', icon: GraduationCap, content: <div className="practice-list">{lesson.grammarQuiz.map((question, i) => <div key={i}><p>{question.prompt}</p><small>{question.options?.join(' · ')}</small><button onClick={() => setShown(previous => ({ ...previous, [`grammar${i}`]: !previous[`grammar${i}`] }))}>{shown[`grammar${i}`] ? `Answer: ${question.options?.[question.correctIndex]} — ${question.explanation || ''}` : 'Show answer'}</button></div>)}</div> })
  if (lesson.sentenceReorder?.sentences?.length) sections.push({ title: 'Sentence reorder', icon: ListChecks, content: <SentenceReorderExercise exercise={lesson.sentenceReorder} /> })
  if (lesson.pairing?.pairs?.length) sections.push({ title: 'Pairing', icon: ListChecks, content: <PairingExercise exercise={lesson.pairing} /> })
  if (lesson.writing?.sentences?.length) sections.push({ title: 'Writing practice', icon: PencilLine, content: <div className="practice-list">{lesson.writing.sentences.map((sentence, i) => <div key={i}><p>{sentence.english || sentence.prompt}</p><button onClick={() => setShown(previous => ({ ...previous, [`writing${i}`]: !previous[`writing${i}`] }))}>{shown[`writing${i}`] ? `Example: ${sentence.russian || sentence.sampleResponse}` : 'Show example answer'}</button></div>)}</div> })
  if (lesson.situations?.length) sections.push({ title: 'When would you use it?', icon: Lightbulb, content: <div className="practice-list">{lesson.situations.map((situation, i) => <div key={i}><p>{situation.scenario}</p><small>{situation.explanation}</small></div>)}</div> })
  if (lesson.usageCheck?.length) sections.push({ title: 'Use it in a sentence', icon: PencilLine, content: <div className="practice-list">{lesson.usageCheck.map((check, i) => <div key={i}><p>{check.sentence}</p><small>Answer: {check.answer}</small></div>)}</div> })
  if (lesson.idioms?.length) sections.push({ title: 'The expression', icon: Quote, content: <div className="practice-list">{lesson.idioms.map((idiom, i) => <div key={i}><h3>{idiom.russian}</h3><p>{idiom.english} · Literally: {idiom.literalMeaning}</p><small>{idiom.usage}</small></div>)}</div> })
  return <div className="practice-accordions">{sections.map(section => <details key={section.title}><summary><section.icon size={19} />{section.title}<ChevronDown size={18} /></summary>{section.content}</details>)}</div>
}

function SentenceReorderExercise({ exercise }) {
  const [picked, setPicked] = useState([])
  const [checked, setChecked] = useState(false)
  const correct = JSON.stringify(picked) === JSON.stringify(exercise.correctOrder)
  return <div className="interactive-practice"><p>Tap the sentences in the order they happened.</p><div className="reorder-picked">{picked.length ? picked.map((index, position) => <button key={position} onClick={() => { setPicked(picked.filter((_, i) => i !== position)); setChecked(false) }}><span>{position + 1}</span>{exercise.sentences[index]} <X size={14} /></button>) : <span>Your ordered sentences will appear here.</span>}</div><div className="reorder-options">{exercise.sentences.map((sentence, index) => <button key={index} disabled={picked.includes(index)} onClick={() => { setPicked([...picked, index]); setChecked(false) }}>{sentence}</button>)}</div><button className="practice-check" onClick={() => setChecked(true)} disabled={picked.length !== exercise.sentences.length}>Check order</button>{checked && <p className={correct ? 'practice-success' : 'practice-error'}>{correct ? 'That’s the right order!' : `Try again. The story order is: ${exercise.correctOrder.map(index => exercise.sentences[index]).join(' → ')}`}</p>}</div>
}

function PairingExercise({ exercise }) {
  const [left, setLeft] = useState(null)
  const [matched, setMatched] = useState([])
  const [message, setMessage] = useState('')
  const pairs = exercise.pairs
  return <div className="interactive-practice"><p>Choose a phrase on the left, then its match on the right.</p><div className="pair-columns"><div>{pairs.map((pair, index) => <button key={index} className={`${left === index ? 'picked' : ''} ${matched.includes(index) ? 'matched' : ''}`} disabled={matched.includes(index)} onClick={() => { setLeft(index); setMessage('') }}>{pair.left}</button>)}</div><div>{[...pairs].reverse().map((pair, reverseIndex) => { const index = pairs.length - 1 - reverseIndex; return <button key={index} className={matched.includes(index) ? 'matched' : ''} disabled={matched.includes(index)} onClick={() => { if (left === null) return; if (left === index) { setMatched([...matched, index]); setMessage('Correct pair!') } else setMessage('Try another match.'); setLeft(null) }}>{pair.right}</button> })}</div></div>{message && <p className={message.startsWith('Correct') ? 'practice-success' : 'practice-error'}>{message}</p>}{matched.length === pairs.length && <p className="practice-success">All pairs matched!</p>}</div>
}

function StructuredLesson({ item, lesson, questions, isComplete, onComplete }) {
  const [answer, setAnswer] = useState({})
  const [draft, setDraft] = useState(() => readStore(`matroshka.draft.${item.key}`, ''))
  const [referenceSearch, setReferenceSearch] = useState('')
  const [visible, setVisible] = useState(24)
  const isScenario = item.category === 'Chats' || item.category === 'Missions'
  const isReference = item.category === 'Conjugation' || item.category === 'Declension'
  const referenceItems = isReference ? (lesson.verbs || lesson.nouns || []) : []
  const referenceResults = referenceItems.filter(entry => !referenceSearch || `${entry.infinitive || entry.nominative} ${entry.translation}`.toLocaleLowerCase().includes(referenceSearch.toLocaleLowerCase()))
  function saveDraft(value) { setDraft(value); writeStore(`matroshka.draft.${item.key}`, value) }
  return <div className="structured-layout"><section className="stage-card structured-card"><div className="stage-eyebrow"><CategoryIcon category={item.category} size={17} /> {byCategory[item.category]?.label.toUpperCase() || 'LESSON'}</div>{lesson.description && <p className="structured-description">{lesson.description}</p>}
    {isScenario && <><div className="scenario-note"><MessageCircle size={22} /><div><strong>{lesson.aiPersona || 'Your practice partner'}</strong><p>{lesson.initialPrompt}</p></div></div><p className="gentle-note">Use this as a self-guided practice space. Your writing stays in this browser; there is no paid AI or account.</p>{(lesson.suggestedPhrases || lesson.hints || lesson.objectives)?.length > 0 && <div className="hint-list"><h3>Helpful ideas</h3>{(lesson.suggestedPhrases || lesson.hints || lesson.objectives).map((hint, i) => <button key={i} onClick={() => saveDraft(`${draft}${draft ? '\n' : ''}${hint}`)}><Lightbulb size={16} />{typeof hint === 'string' ? hint : JSON.stringify(hint)}</button>)}</div>}<label className="writing-label" htmlFor="practice-draft">Your response</label><textarea id="practice-draft" value={draft} onChange={event => saveDraft(event.target.value)} placeholder="Try writing your answer in Russian..." rows={6} /><div className="note-footer">Saved locally as you type</div></>}
    {item.category === 'Writing' && <>{(lesson.prompts || []).map((prompt, i) => <div key={i} className="writing-prompt"><span>Prompt {i + 1}</span><h3>{prompt.prompt || prompt.promptRussian}</h3>{prompt.promptRussian && <p>{prompt.promptRussian}</p>}{prompt.hints?.length > 0 && <small>Try: {prompt.hints.join(' · ')}</small>}</div>)}<label className="writing-label" htmlFor="writing-draft">Your writing notebook</label><textarea id="writing-draft" value={draft} onChange={event => saveDraft(event.target.value)} placeholder="Начните писать здесь..." rows={10} /><div className="note-footer">Saved locally as you type</div></>}
    {item.category === 'Shadowing' && <div className="shadow-list">{(lesson.items || []).map((entry, i) => <div key={i}><button aria-label={`Speak ${entry.russian}`} onClick={() => { const utterance = new SpeechSynthesisUtterance(entry.russian); utterance.lang = 'ru-RU'; speechSynthesis.speak(utterance) }}><Volume2 size={18} /></button><div><strong>{entry.russian}</strong><span>{entry.english}</span>{entry.tip && <small>{entry.tip}</small>}</div></div>)}</div>}
    {isReference && <><div className="search-box reference-search"><Search size={18} /><input value={referenceSearch} onChange={event => { setReferenceSearch(event.target.value); setVisible(24) }} placeholder={`Search ${item.category === 'Conjugation' ? 'verbs' : 'nouns'}...`} /></div><p className="reference-count">{referenceResults.length} entries</p><div className="reference-list">{referenceResults.slice(0, visible).map((entry, i) => <details key={i}><summary><strong>{entry.infinitive || entry.nominative}</strong><span>{entry.translation}</span><ChevronDown size={17} /></summary><div className="reference-fields">{Object.entries(entry).filter(([key]) => !['id', 'infinitive', 'nominative', 'translation'].includes(key)).map(([key, value]) => <div key={key}><strong>{key.replace(/([A-Z])/g, ' $1')}</strong><span>{typeof value === 'object' ? Object.entries(value || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ') : String(value)}</span></div>)}</div></details>)}</div>{referenceResults.length > visible && <button className="button secondary" onClick={() => setVisible(visible + 24)}>Show more</button>}</>}
    {item.category === 'Reading' && Array.isArray(lesson) && lesson.map((reading, i) => <div key={i} className="reading-sample"><h2>{reading.title}</h2>{reading.paragraphs?.map((paragraph, j) => <p key={j}>{paragraph}</p>)}<h3>Vocabulary</h3>{reading.vocab?.map((entry, j) => <div key={j} className="mini-vocab"><strong>{entry.lemma}</strong><span>{entry.definition}</span></div>)}</div>)}
    {lesson.intro && <div className="grammar-intro"><h2>The idea</h2><p>{lesson.intro}</p></div>}
    {lesson.rules?.length > 0 && <div className="rules"><h3>Rules to remember</h3>{lesson.rules.map((rule, i) => <div key={i}><span>{i + 1}</span>{typeof rule === 'string' ? rule : JSON.stringify(rule)}</div>)}</div>}
    {lesson.examples?.length > 0 && <div className="examples"><h3>Examples</h3>{lesson.examples.map((example, i) => <p key={i}>{typeof example === 'string' ? example : JSON.stringify(example)}</p>)}</div>}
    {lesson.tables?.map((table, i) => <div className="lesson-table-wrap" key={i}><h3>{table.title}</h3><table><thead><tr>{(table.headers || []).map((head, j) => <th key={j}>{head}</th>)}</tr></thead><tbody>{(table.rows || []).map((row, j) => <tr key={j}><th>{row.label}</th>{row.cells?.map((cell, k) => <td key={k}>{cell}</td>)}</tr>)}</tbody></table></div>)}
    {questions.length > 0 && <div className="inline-quiz"><h2>Check what you know</h2><p>Choose an answer to see the explanation.</p>{questions.map((question, qi) => <div className="inline-question" key={qi}><strong>{qi + 1}. {question.prompt}</strong><div>{question.options.map((option, oi) => <button key={oi} className={answer[qi] !== undefined ? oi === question.correctIndex ? 'correct' : answer[qi] === oi ? 'incorrect' : '' : ''} disabled={answer[qi] !== undefined} onClick={() => setAnswer(previous => ({ ...previous, [qi]: oi }))}>{String(option)}</button>)}</div>{answer[qi] !== undefined && <p>{question.explanation || `Answer: ${question.options[question.correctIndex]}`}</p>}</div>)}</div>}
    {lesson.fillInBlank && <PracticeSections lesson={lesson} />}
    {lesson.sets?.length > 0 && <div className="generic-section"><h2>Practice rounds</h2>{lesson.sets.map((set, i) => <details key={i}><summary>{set.title || `Round ${i + 1}`} <ChevronDown size={17} /></summary><pre className="structured-json">{JSON.stringify(set, null, 2)}</pre></details>)}</div>}
    {!isScenario && !isReference && !['Writing', 'Shadowing', 'Reading'].includes(item.category) && !lesson.intro && !questions.length && !lesson.sets && <div className="generic-section"><h2>Lesson details</h2><pre className="structured-json">{JSON.stringify(lesson, null, 2)}</pre></div>}
    <button className={`button stage-action ${isComplete ? 'secondary' : 'primary'}`} onClick={onComplete}>{isComplete ? <><Check size={17} /> Completed</> : <>Mark lesson complete <Check size={17} /></>}</button>
  </section><aside className="lesson-aside"><div className={`aside-art tone-${byCategory[item.category]?.tone || 'rose'}`}><CategoryIcon category={item.category} size={60} /><span>✳</span></div><div className="aside-panel"><span className="aside-kicker">GOOD TO KNOW</span><div><Heart size={18} /><span>Every lesson is free</span></div><div><Bookmark size={18} /><span>Progress stays on this device</span></div>{isScenario && <div><Lightbulb size={18} /><span>Self-guided practice</span></div>}</div></aside></div>
}

createRoot(document.getElementById('root')).render(<App />)
