import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

const TOPICS = [
  'Organización del Estado y de la Administración Pública',
  'Derecho Administrativo General',
  'Organización de la Hacienda Pública y Derecho Tributario',
  'Normativa tributaria: conceptos generales',
  'Gestión tributaria',
  'Recaudación tributaria',
  'Inspección tributaria',
  'Revisión en vía administrativa',
  'Impuesto sobre la Renta de las Personas Físicas',
  'Impuesto sobre el Valor Añadido',
  'Impuesto sobre Sociedades',
  'Aduanas y otros tributos',
  'Informática y administración electrónica',
  'Otros temas del programa'
];

const STARTER_QUESTIONS = [
  {
    id: 'demo-001',
    topic: 'Normativa tributaria: conceptos generales',
    question: '¿Qué norma contiene la regulación general del sistema tributario español?',
    options: ['Ley 58/2003, General Tributaria', 'Ley 39/2015, del Procedimiento Administrativo Común', 'Ley 40/2015, de Régimen Jurídico del Sector Público', 'Constitución Española, exclusivamente'],
    correct: 0,
    explanation: 'La Ley 58/2003, de 17 de diciembre, General Tributaria, establece los principios y las normas generales del sistema tributario español.',
    source: 'Ley 58/2003, de 17 de diciembre, General Tributaria. Pregunta de demostración; verificar texto consolidado vigente antes de usar en preparación oficial.'
  },
  {
    id: 'demo-002',
    topic: 'Derecho Administrativo General',
    question: 'Con carácter general, ¿qué ley regula el procedimiento administrativo común de las Administraciones Públicas?',
    options: ['Ley 39/2015', 'Ley 58/2003', 'Ley 19/2013', 'Ley Orgánica 3/1981'],
    correct: 0,
    explanation: 'La Ley 39/2015, de 1 de octubre, regula el procedimiento administrativo común de las Administraciones Públicas, sin perjuicio de las especialidades aplicables.',
    source: 'Ley 39/2015, de 1 de octubre. Pregunta de demostración; verificar texto consolidado vigente antes de usar en preparación oficial.'
  },
  {
    id: 'demo-003',
    topic: 'Organización del Estado y de la Administración Pública',
    question: 'Según la Constitución Española, ¿en quién reside la soberanía nacional?',
    options: ['En las Cortes Generales', 'En el pueblo español', 'En el Gobierno', 'En el Tribunal Constitucional'],
    correct: 1,
    explanation: 'El artículo 1.2 de la Constitución establece que la soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado.',
    source: 'Constitución Española, artículo 1.2. Pregunta de demostración.'
  }
];

const STORE = 'opohacienda-v1';
const safeRead = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORE) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
};

export default function App() {
  const [questions, setQuestions] = useState(() => {
    const saved = safeRead();
    return Array.isArray(saved.questions) ? saved.questions : STARTER_QUESTIONS;
  });
  const [progress, setProgress] = useState(() => {
    const saved = safeRead();
    return saved.progress && typeof saved.progress === 'object' ? saved.progress : {};
  });
  const [screen, setScreen] = useState('practice');
  const [topic, setTopic] = useState('Todos los temas');
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [notice, setNotice] = useState('');
  const [importText, setImportText] = useState('');
  const [manual, setManual] = useState({ topic: TOPICS[0], question: '', options: ['', '', '', ''], correct: 0, explanation: '', source: '' });
  const [supabaseStatus, setSupabaseStatus] = useState(supabase ? 'Configuración encontrada; falta preparar la tabla y permisos.' : 'Sin conectar: el progreso se guarda solo en este dispositivo.');

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify({ questions, progress })); }
    catch { setNotice('No se pudo guardar en este dispositivo.'); }
  }, [questions, progress]);

  const filtered = useMemo(() => questions.filter(q => topic === 'Todos los temas' || q.topic === topic), [questions, topic]);
  const current = filtered.length ? filtered[Math.min(index, filtered.length - 1)] : null;
  const answers = Object.values(progress);
  const correctCount = answers.filter(a => a.correct).length;
  const wrongCount = answers.filter(a => !a.correct).length;
  const wrongIds = new Set(Object.entries(progress).filter(([, a]) => !a.correct).map(([id]) => id));
  const wrongQuestions = questions.filter(q => wrongIds.has(String(q.id)));

  function changeScreen(next) {
    setScreen(next);
    setChosen(null);
    setShowExplanation(false);
    setNotice('');
  }
  function changeTopic(value) {
    setTopic(value);
    setIndex(0);
    setChosen(null);
    setShowExplanation(false);
  }
  function answer(optionIndex) {
    if (!current || chosen !== null) return;
    const isCorrect = optionIndex === Number(current.correct);
    setChosen(optionIndex);
    setShowExplanation(true);
    setProgress(old => ({ ...old, [String(current.id)]: { selected: optionIndex, correct: isCorrect, at: new Date().toISOString() } }));
  }
  function nextQuestion() {
    if (!filtered.length) return;
    setIndex(i => (i + 1) % filtered.length);
    setChosen(null);
    setShowExplanation(false);
  }
  function previousQuestion() {
    if (!filtered.length) return;
    setIndex(i => (i - 1 + filtered.length) % filtered.length);
    setChosen(null);
    setShowExplanation(false);
  }
  function importQuestions() {
    try {
      const parsed = JSON.parse(importText);
      const incoming = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(incoming) || incoming.length === 0) throw new Error('El JSON debe contener un array de preguntas o una propiedad "questions".');
      const valid = incoming.every(q =>
        q && q.id !== undefined && typeof q.topic === 'string' &&
        typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4 &&
        q.options.every(o => typeof o === 'string') &&
        Number.isInteger(Number(q.correct)) && Number(q.correct) >= 0 && Number(q.correct) <= 3
      );
      if (!valid) throw new Error('Formato incorrecto. Cada pregunta necesita id, topic, question, cuatro options y correct (0-3).');
      const normalized = incoming.map(q => ({ ...q, correct: Number(q.correct), explanation: q.explanation || '', source: q.source || '' }));
      setQuestions(old => {
        const map = new Map(old.map(q => [String(q.id), q]));
        normalized.forEach(q => map.set(String(q.id), q));
        return Array.from(map.values());
      });
      setImportText('');
      setNotice(`Importadas/actualizadas ${normalized.length} preguntas. Total: ${new Set([...questions, ...normalized].map(q => String(q.id))).size}.`);
    } catch (e) { setNotice(e.message || 'No se pudo leer el JSON.'); }
  }
  function addQuestion(e) {
    e.preventDefault();
    if (!manual.question.trim() || manual.options.some(o => !o.trim())) {
      setNotice('Completa el enunciado y las cuatro respuestas.'); return;
    }
    const item = { ...manual, id: `manual-${Date.now()}`, correct: Number(manual.correct), question: manual.question.trim(), options: manual.options.map(o => o.trim()) };
    setQuestions(old => [...old, item]);
    setManual({ topic: TOPICS[0], question: '', options: ['', '', '', ''], correct: 0, explanation: '', source: '' });
    setNotice('Pregunta añadida.');
  }
  function exportQuestions() {
    const blob = new Blob([JSON.stringify({ questions }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'opohacienda-preguntas.json'; a.click();
    URL.revokeObjectURL(url);
  }
  function resetProgress() {
    if (window.confirm('¿Borrar todas las estadísticas y respuestas guardadas en este dispositivo?')) setProgress({});
  }

  return <div className="app-shell">
    <header className="hero">
      <div className="brand-mark">OH</div>
      <div className="hero-copy">
        <p className="eyebrow">PREPARACIÓN DE OPOSICIONES</p>
        <h1>OpoHacienda</h1>
        <p>Agente de Hacienda Pública · Tu entrenamiento diario</p>
      </div>
      <div className="hero-count"><strong>{questions.length}</strong><span>preguntas</span></div>
    </header>

    <nav className="nav-tabs" aria-label="Secciones">
      {[['practice','Practicar'],['stats','Estadísticas'],['errors','Fallos'],['settings','Temas y datos']].map(([id,label]) =>
        <button key={id} className={screen === id ? 'nav-tab active' : 'nav-tab'} onClick={() => changeScreen(id)}>{label}</button>
      )}
    </nav>

    <main>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div>}

      {screen === 'practice' && <section className="panel">
        <div className="section-head">
          <div><p className="eyebrow">MODO TEST</p><h2>Practica a tu ritmo</h2></div>
          <span className="pill">{filtered.length ? `${Math.min(index + 1, filtered.length)} / ${filtered.length}` : '0 preguntas'}</span>
        </div>
        <label className="field-label" htmlFor="topic-select">Tema</label>
        <select id="topic-select" value={topic} onChange={e => changeTopic(e.target.value)}>
          <option>Todos los temas</option>{TOPICS.map(t => <option key={t}>{t}</option>)}
        </select>
        {current ? <>
          <div className="question-meta"><span>{current.topic}</span><span>Pregunta {index + 1}</span></div>
          <h3 className="question-text">{current.question}</h3>
          <div className="answers">{current.options.map((option, i) => {
            let cls = 'answer';
            if (chosen !== null && i === Number(current.correct)) cls += ' answer-correct';
            else if (chosen === i && i !== Number(current.correct)) cls += ' answer-wrong';
            return <button key={i} className={cls} onClick={() => answer(i)} disabled={chosen !== null}>
              <span className="answer-letter">{'ABCD'[i]}</span><span>{option}</span>
            </button>;
          })}</div>
          {showExplanation && <div className={chosen === Number(current.correct) ? 'feedback good' : 'feedback bad'}>
            <strong>{chosen === Number(current.correct) ? '¡Correcto!' : 'Respuesta incorrecta'}</strong>
            <p>{current.explanation || 'No hay explicación añadida para esta pregunta.'}</p>
            {current.source && <small>Fuente: {current.source}</small>}
          </div>}
          <div className="question-actions">
            <button className="button secondary" onClick={previousQuestion}>Anterior</button>
            <button className="button primary" onClick={nextQuestion}>Siguiente <span aria-hidden="true">→</span></button>
          </div>
        </> : <div className="empty-state"><h3>No hay preguntas para este tema</h3><p>Importa un lote desde «Temas y datos».</p></div>}
        <p className="disclaimer">Las preguntas de demostración no constituyen un banco oficial. Contrasta siempre la normativa vigente.</p>
      </section>}

      {screen === 'stats' && <section className="panel">
        <p className="eyebrow">TU EVOLUCIÓN</p><h2>Estadísticas</h2>
        <div className="stat-grid">
          <div className="stat-card"><span>Preguntas respondidas</span><strong>{answers.length}</strong></div>
          <div className="stat-card"><span>Aciertos</span><strong>{correctCount}</strong></div>
          <div className="stat-card"><span>Fallos</span><strong>{wrongCount}</strong></div>
          <div className="stat-card"><span>Porcentaje de acierto</span><strong>{answers.length ? Math.round(correctCount / answers.length * 100) : 0}%</strong></div>
        </div>
        <div className="progress-track"><div style={{ width: `${answers.length ? correctCount / answers.length * 100 : 0}%` }} /></div>
        <button className="button secondary" onClick={resetProgress}>Borrar estadísticas de este dispositivo</button>
      </section>}

      {screen === 'errors' && <section className="panel">
        <p className="eyebrow">REPASO INTELIGENTE</p><h2>Preguntas falladas</h2>
        <p className="muted">Se muestran las preguntas cuya última respuesta registrada fue incorrecta.</p>
        {wrongQuestions.length ? <div className="error-list">{wrongQuestions.map(q => <article className="error-item" key={q.id}>
          <span className="topic-tag">{q.topic}</span><h3>{q.question}</h3><p><strong>Correcta:</strong> {q.options[Number(q.correct)]}</p><p>{q.explanation}</p>
          <button className="button secondary small" onClick={() => { changeTopic(q.topic); setIndex(Math.max(0, questions.filter(x => x.topic === q.topic).findIndex(x => String(x.id) === String(q.id))); changeScreen('practice'); }}>Practicar este tema</button>
        </article>)}</div> : <div className="empty-state"><h3>¡Todavía no hay fallos!</h3><p>Cuando respondas preguntas, aparecerán aquí las que necesites repasar.</p></div>}
      </section>}

      {screen === 'settings' && <section className="panel">
        <p className="eyebrow">GESTIÓN DEL BANCO</p><h2>Temas y datos</h2>
        <div className="topic-list">{TOPICS.map((t, i) => <div className="topic-row" key={t}><span className="topic-number">{String(i + 1).padStart(2,'0')}</span><span>{t}</span><strong>{questions.filter(q => q.topic === t).length}</strong></div>)}</div>
        <div className="settings-block">
          <h3>Importar preguntas desde JSON</h3>
          <p className="muted">El archivo debe tener una propiedad <code>questions</code> con preguntas, cuatro opciones y el índice de la respuesta correcta (0–3).</p>
          <textarea rows="6" value={importText} onChange={e => setImportText(e.target.value)} placeholder='Pega aquí el contenido JSON, por ejemplo: {"questions":[...]}' />
          <div className="button-row"><button className="button primary" onClick={importQuestions}>Importar preguntas</button><button className="button secondary" onClick={exportQuestions}>Exportar banco</button></div>
        </div>
        <div className="settings-block">
          <h3>Añadir pregunta manualmente</h3>
          <form onSubmit={addQuestion} className="manual-form">
            <label className="field-label">Tema<select value={manual.topic} onChange={e => setManual({...manual, topic:e.target.value})}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select></label>
            <label className="field-label">Enunciado<textarea rows="2" required value={manual.question} onChange={e => setManual({...manual, question:e.target.value})} /></label>
            {manual.options.map((o,i) => <label className="field-label" key={i}>Respuesta {'ABCD'[i]}<input required value={o} onChange={e => setManual({...manual, options:manual.options.map((x,j)=>j===i?e.target.value:x)})} /></label>)}
            <label className="field-label">Respuesta correcta<select value={manual.correct} onChange={e => setManual({...manual,correct:Number(e.target.value)})}>{[0,1,2,3].map(i=><option key={i} value={i}>{'ABCD'[i]}</option>)}</select></label>
            <label className="field-label">Explicación<textarea rows="2" value={manual.explanation} onChange={e => setManual({...manual,explanation:e.target.value})} /></label>
            <label className="field-label">Fuente normativa<input value={manual.source} onChange={e => setManual({...manual,source:e.target.value})} placeholder="Norma y artículo" /></label>
            <button className="button primary" type="submit">Añadir pregunta</button>
          </form>
        </div>
        <div className="settings-block connection">
          <h3>Sincronización con Supabase</h3>
          <p>{supabaseStatus}</p>
          <p className="muted">La interfaz está preparada para añadir la conexión. La sincronización entre dispositivos no se activa hasta configurar el proyecto, la tabla y sus permisos de seguridad.</p>
        </div>
      </section>}
    </main>
    <footer><span>OpoHacienda · Versión inicial</span><span>Diseñada para móvil, iPad y ordenador</span></footer>
  </div>;
}