import { useEffect, useRef, useState } from 'react';
import { AXES, choose, freshProfile, loadProfile, MAX_IMPORT_BYTES, parseProfile, STORAGE_KEY, type Profile } from './model';
import { downloadFile, EXPORTS, exportContent, type ExportKind } from './exports';
import { Preview } from './Preview';

type Tab = 'discover' | 'refine' | 'export';
export default function App() {
  const [initial] = useState(loadProfile);
  const [profile, setProfile] = useState(initial.profile);
  const [tab, setTab] = useState<Tab>('discover');
  const [round, setRound] = useState(initial.profile.history.length % AXES.length);
  const [message, setMessage] = useState(initial.warning);
  const [undo, setUndo] = useState<Profile[]>([]);
  const [kind, setKind] = useState<ExportKind>('skill');
  const [confirmReset, setConfirmReset] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const axis = AXES[round];
  const observed = new Set(profile.history.filter(item => item.value !== null).map(item => item.axis)).size;
  const selectedExport = EXPORTS.find(item => item.id === kind)!;
  const content = exportContent(profile, kind);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, name: profile.name.trim() || 'Untitled project' })); }
    catch { setMessage('Browser storage is unavailable or full. Export your profile before closing this tab.'); }
  }, [profile]);
  useEffect(() => {
    if (confirmReset) resetDialog.current?.showModal();
    else resetDialog.current?.close();
  }, [confirmReset]);
  function update(next: Profile) { setUndo(current => [...current, profile].slice(-30)); setProfile(next); }
  function select(value: number | null) {
    update(choose(profile, axis.id, value));
    setRound((round + 1) % AXES.length);
    setMessage(value === null ? `${axis.title} skipped. Your current setting is unchanged.` : `${axis.title} preference saved. Try the next comparison.`);
    heading.current?.focus();
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try { if (file.size > MAX_IMPORT_BYTES) throw new Error('Profile is too large. Maximum size is 100 KB.'); const imported = parseProfile(await file.text()); update(imported); setRound(imported.history.length % AXES.length); setMessage(`Imported “${imported.name}”. Your previous profile is available with Undo.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Import failed.'); }
    if (input.current) input.current.value = '';
  }
  function reset() { update(freshProfile()); setRound(0); setConfirmReset(false); setMessage('Fresh canvas. Your previous profile is available with Undo.'); }
  return <>
    <header className="masthead"><a className="brand" href="./" aria-label="Tastecraft home"><span className="brand-mark">t<span>•</span></span>Tastecraft<span className="version">STUDIO / 0.1</span></a><div className="header-actions"><span className="local-label"><i/> Local. Yours.</span><a href="https://github.com/alfonza1/tastecraft" target="_blank" rel="noreferrer">GitHub ↗</a></div></header>
    <main>
      <section className="intro"><div><p className="eyebrow">GOOD TASTE IS PERSONAL.</p><h1>Make your taste<br/><span>tangible.</span><svg className="title-spark" viewBox="0 0 80 80" aria-hidden="true"><path d="M40 3v74M3 40h74M14 14l52 52M14 66l52-52"/></svg></h1><p className="intro-copy">Choose what feels right. Shape a visual direction.<br/>Give your coding agent something concrete to follow.</p></div><div className="intro-art" aria-hidden="true"><div className="art-card back">Aa<span>YOUR INSTINCTS</span></div><div className="art-card front"><div className="color-dots"><i/><i/><i/></div><strong>Your eye.<br/>Your rules.</strong><span>CRAFTED THROUGH CHOICES ↗</span></div></div></section>
      <div className="workbench-top"><nav className="tabs" aria-label="Studio sections">{(['discover', 'refine', 'export'] as Tab[]).map((item, index) => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}><span>{index + 1}</span>{item === 'discover' ? 'Find your direction' : item === 'refine' ? 'Make it yours' : 'Take it with you'}</button>)}</nav><button className="text-button" disabled={!undo.length} onClick={() => { const previous = undo.at(-1)!; setProfile(previous); setUndo(current => current.slice(0, -1)); setRound(previous.history.length % AXES.length); setMessage('Previous profile restored.'); }}>↶ Undo</button></div>
      <div className="workspace">
        <section className="main-panel">
          {tab === 'discover' ? <>
            <div className="panel-heading"><div><p className="eyebrow">{String(round + 1).padStart(2, '0')} / 05 · {axis.title.toUpperCase()}</p><h2 ref={heading} tabIndex={-1}>{axis.question}</h2><p>{axis.hint}</p></div><span className="interactive-badge">LIVE PREVIEWS</span></div>
            <div className="comparison">{[0, 100].map((value, index) => <article className="option" key={`${axis.id}-${value}`}><div className="option-label"><span className={`option-letter ${index ? 'peach' : ''}`}>{index ? 'B' : 'A'}</span><strong>{index ? axis.high : axis.low}</strong><span>Try it ↓</span></div><Preview values={{ ...profile.values, [axis.id]: value }} label={`Option ${index ? 'B' : 'A'} preview`}/><button className="choose-button" onClick={() => select(value)}>I prefer {index ? 'B' : 'A'} <span>↗</span></button></article>)}</div>
            <div className="comparison-bottom"><p>One difference at a time. No right answer.</p><button className="text-button" onClick={() => select(null)}>No preference →</button></div>
            <div className="axis-dots" aria-label="Choose a comparison">{AXES.map((item, index) => <button key={item.id} className={round === index ? 'current' : ''} onClick={() => setRound(index)} aria-label={`Compare ${item.title}`} aria-pressed={round === index}>{item.title}</button>)}</div>
          </> : tab === 'refine' ? <>
            <div className="panel-heading"><div><p className="eyebrow">YOUR DIRECTION, IN DETAIL</p><h2>Trust your eye.</h2><p>Refine the settings and try your working reference.</p></div></div>
            <div className="refine-grid"><div className="controls"><label className="project-label">Project name<input value={profile.name} maxLength={80} onChange={event => setProfile({ ...profile, name: event.target.value })} onBlur={() => { if (!profile.name.trim()) setProfile({ ...profile, name: 'Untitled project' }); }}/></label>{AXES.map(item => <div className="slider-control" key={item.id}><label htmlFor={`axis-${item.id}`}>{item.title}<output>{profile.values[item.id]}</output></label><input id={`axis-${item.id}`} type="range" min="0" max="100" value={profile.values[item.id]} onChange={event => setProfile({ ...profile, values: { ...profile.values, [item.id]: Number(event.target.value) } })}/><div><span>{item.low}</span><span>{item.high}</span></div></div>)}<p className="fine-print">Manual settings take effect immediately. New comparisons average the recorded choices for that axis.</p></div><Preview values={profile.values} label="Your refined preview"/></div>
          </> : <>
            <div className="panel-heading"><div><p className="eyebrow">PORTABLE BY DESIGN</p><h2>Your taste. Anywhere.</h2><p>Real files for your project, your agent, and your next idea.</p></div></div>
            <div className="export-guide"><span>↗</span><p><strong>Start with the agent skill.</strong> Put it in your agent’s skills folder. Add the CSS tokens and React reference to your project. Export JSON to reopen your profile here.</p></div>
            <div className="export-tabs" aria-label="Export formats">{EXPORTS.map(item => <button key={item.id} aria-pressed={kind === item.id} onClick={() => setKind(item.id)}>{item.label}</button>)}</div>
            <div className="code-window"><div><span>{selectedExport.filename}</span><span>{new TextEncoder().encode(content).length.toLocaleString()} bytes</span></div><pre tabIndex={0} aria-label={`${selectedExport.label} preview`}>{content}</pre></div>
            <div className="export-actions"><button className="primary-button" onClick={() => { downloadFile(content, selectedExport.filename, selectedExport.type); setMessage(`Downloaded ${selectedExport.filename}.`); }}>Download {selectedExport.filename} ↓</button><button className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(content); setMessage('Copied to clipboard.'); } catch { setMessage('Clipboard access is unavailable. Use Download instead.'); } }}>Copy contents</button></div>
          </>}
        </section>
        <aside className="profile-panel"><div className="profile-top"><span className="eyebrow">YOUR TASTE PROFILE</span><span className="profile-seal">✳</span></div><h2>{profile.name || 'Untitled project'}</h2><p className="profile-description">A direction shaped by your choices.<br/>Always yours to change.</p><div className="progress-label"><strong>{observed} of 5</strong><span>dimensions explored</span></div><div className="profile-progress"><span style={{ width: `${observed * 20}%` }}/></div><div className="profile-axes">{AXES.map(item => <div key={item.id}><div><span>{item.title}</span><strong>{profile.values[item.id] < 35 ? item.low : profile.values[item.id] > 65 ? item.high : 'Balanced'}</strong></div><div className="mini-range"><i style={{ left: `${profile.values[item.id]}%` }}/></div></div>)}</div><p className="evidence-count">{profile.history.filter(item => item.value !== null).length} recorded choices · {profile.history.filter(item => item.value === null).length} skips</p><button className="profile-export" onClick={() => setTab('export')}>Export your direction <span>↗</span></button><div className="profile-tools"><button onClick={() => input.current?.click()}>Import profile</button><button onClick={() => setConfirmReset(true)}>Start fresh</button></div><input ref={input} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Import Tastecraft profile" onChange={event => { void importFile(event.target.files?.[0]); }}/><div className="privacy-note"><span>◉</span><p>No account. No API key.<br/>Your profile stays in this browser.</p></div></aside>
      </div>
      <div role="status" aria-live="polite" className={message ? 'status-message' : 'status-message empty'}>{message || 'Ready when you are.'}</div>
      <footer><span>Tastecraft <strong>—</strong> A small studio for your point of view.</span><span>Five dimensions. Unlimited directions.</span></footer>
    </main>
    <dialog ref={resetDialog} role="alertdialog" aria-labelledby="reset-title" className="reset-dialog" onCancel={() => setConfirmReset(false)}><h2 id="reset-title">A fresh canvas?</h2><p>Your current direction will be replaced. You can undo this, or export your profile first.</p><div><button autoFocus className="secondary-button" onClick={() => setConfirmReset(false)}>Keep my profile</button><button className="primary-button" onClick={reset}>Start fresh</button></div></dialog>
  </>;
}
