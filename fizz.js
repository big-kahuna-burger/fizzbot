const got = require('got')

const apiBase = 'https://api.noopschallenge.com'
const init = `/fizzbot/questions/1`

function createAnswer ({ rules, numbers }) {
  return numbers
    .map(n =>
      rules.reduce((prev, curr) => {
        if (n % curr.number !== 0) return prev
        if (prev === n) return curr.response
        if (typeof prev === 'string') return prev + curr.response
      }, n)
    )
    .join(' ')
}

async function onCycle (x) {
  if (x.questionUrl === init) {
    return onAnswer({ question: init, answer: 'javascript' })
  }

  const { questionUrl, rules, numbers } = x
  if (rules && numbers) {
    const nextAnswer = createAnswer({ rules, numbers })
    return onAnswer({
      question: questionUrl,
      answer: nextAnswer
    })
  }
}

async function onAnswer ({ question, answer }) {
  const r = await got.post(apiBase + question, {
    body: JSON.stringify({ answer })
  })
  const { nextQuestion, ...rest } = JSON.parse(r.body)
  if (rest.grade) {
    return onEnd(rest)
  }
  if (nextQuestion) {
    return fetchQuestion(nextQuestion)
  }
}

async function fetchQuestion (url) {
  const r = await got(apiBase + url)
  return onCycle({ questionUrl: url, ...JSON.parse(r.body) })
}

async function onEnd (event) {
  console.log(event)
  process.exit(event.grade === 'A+' ? 0 : 1)
}

onCycle({ questionUrl: init })
