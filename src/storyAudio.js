export function splitStoryText(text) {
  return text.split(/([\p{L}ёЁ-]+)/u)
}

function normalizedWord(value) {
  return String(value || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]/gu, '')
}

export function alignStoryTimings(parts, timings) {
  const written = parts.map((text, partIndex) => ({ text: normalizedWord(text), partIndex })).filter(part => part.text)
  const spoken = timings.map(entry => ({
    text: normalizedWord(entry.text || entry.word),
    label: entry.text || entry.word || '',
    start: Number(entry.start ?? entry.startTime),
    end: Number(entry.end ?? entry.endTime),
  })).filter(entry => entry.text && Number.isFinite(entry.start) && Number.isFinite(entry.end) && entry.end > entry.start)

  const toHighlight = (part, entry) => ({ partIndex: part.partIndex, text: entry.label, start: entry.start, end: entry.end })
  if (written.length === spoken.length && written.every((part, index) => part.text === spoken[index].text)) {
    return written.map((part, index) => toHighlight(part, spoken[index]))
  }

  // A few timing entries combine two written words. Match those as a pair and
  // divide their shared interval by word length so later words stay in sync.
  const matches = Array.from({ length: written.length + 1 }, () => new Uint16Array(spoken.length + 1))
  for (let i = written.length - 1; i >= 0; i -= 1) {
    for (let j = spoken.length - 1; j >= 0; j -= 1) {
      let best = Math.max(matches[i + 1][j], matches[i][j + 1])
      if (written[i].text === spoken[j].text) best = Math.max(best, matches[i + 1][j + 1] + 1)
      if (i + 1 < written.length && written[i].text + written[i + 1].text === spoken[j].text) {
        best = Math.max(best, matches[i + 2][j + 1] + 2)
      }
      matches[i][j] = best
    }
  }

  const aligned = []
  let i = 0
  let j = 0
  while (i < written.length && j < spoken.length) {
    if (written[i].text === spoken[j].text && matches[i][j] === matches[i + 1][j + 1] + 1) {
      aligned.push(toHighlight(written[i], spoken[j]))
      i += 1
      j += 1
    } else if (i + 1 < written.length && written[i].text + written[i + 1].text === spoken[j].text && matches[i][j] === matches[i + 2][j + 1] + 2) {
      const entry = spoken[j]
      const split = entry.start + (entry.end - entry.start) * written[i].text.length / (written[i].text.length + written[i + 1].text.length)
      aligned.push({ partIndex: written[i].partIndex, text: written[i].text, start: entry.start, end: split })
      aligned.push({ partIndex: written[i + 1].partIndex, text: written[i + 1].text, start: split, end: entry.end })
      i += 2
      j += 1
    } else if (matches[i + 1][j] >= matches[i][j + 1]) i += 1
    else j += 1
  }
  return aligned
}
