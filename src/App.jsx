import { useState } from 'react'

function App() {
  const [contador, setContador] = useState(0)
  const [word, setWord] = useState("hello")
  return (
    <div>
      <h1>Hola, React</h1>
      <p>Contador: {contador}</p>
      <button onClick={() => setContador(contador + 1)}>
        Aumentar
      </button>
      <p>WORD: {word}</p>
      <button onClick={() => setWord("translation")}>
        bASE
      </button>
    </div>
  )
}

export default App