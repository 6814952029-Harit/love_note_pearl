import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const STICKERS = ["💌", "🌷", "🦋", "✨", "🧸", "🌙", "🎀", "☁️"];
const FONT_OPTIONS = ["Sarabun", "Playfair Display", "DM Sans", "Georgia"];
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Icon({ children, className = "" }) {
  return <span aria-hidden="true" className={`inline-flex h-5 w-5 items-center justify-center ${className}`}>{children}</span>;
}

function Label({ children }) {
  return <label className="mb-2 block text-xs font-bold tracking-wide text-stone-500">{children}</label>;
}

function Pill({ active, children, onClick }) {
  return <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-stone-900 text-white shadow-sm" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}>{children}</button>;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("letterly_user")); } catch { return null; }
  });
  const [adminOpen, setAdminOpen] = useState(false);
  const [publicSlug, setPublicSlug] = useState(() => new URLSearchParams(window.location.search).get("letter"));
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get("letter") ? "recipient" : "editor");
  const [title, setTitle] = useState("ถึงคนพิเศษของฉัน");
  const [message, setMessage] = useState("ในวันที่เธอได้เปิดอ่านข้อความนี้ ขอให้รู้ไว้ว่ามีคนคนหนึ่งกำลังคิดถึงเธอเสมอ\n\nขอให้ทุกวันของเธอเต็มไปด้วยรอยยิ้มและเรื่องราวดี ๆ นะ");
  const [recipient, setRecipient] = useState("คุณมะลิ");
  const [sender, setSender] = useState("จาก คนที่คิดถึง");
  const [letterColor, setLetterColor] = useState("#fff8e8");
  const [backgroundColor, setBackgroundColor] = useState("#f4eee5");
  const [textColor, setTextColor] = useState("#44352d");
  const [font, setFont] = useState("Sarabun");
  const [fontSize, setFontSize] = useState(18);
  const [textAlign, setTextAlign] = useState("center");
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");
  const [borderColor, setBorderColor] = useState("#44352d");
  const [backgroundPattern, setBackgroundPattern] = useState("none");
  const [stickers, setStickers] = useState(["💌", "🌷"]);
  const [images, setImages] = useState([]);
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [password, setPassword] = useState("sunflower");
  const [hint, setHint] = useState("ดอกไม้ที่เธอชอบที่สุด");
  const [shareMode, setShareMode] = useState("both");
  const [qrStyle, setQrStyle] = useState("rounded");
  const [qrForegroundColor, setQrForegroundColor] = useState("#44352d");
  const [qrBackgroundColor, setQrBackgroundColor] = useState("#f8f4ed");
  const [letterId, setLetterId] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const shareUrl = publicSlug ? `${window.location.origin}/?letter=${publicSlug}` : "";
  const displayStickers = stickers.join("  ");
  const paperStyle = useMemo(() => ({ backgroundColor: letterColor, color: textColor, fontFamily: font, borderColor }), [letterColor, textColor, font, borderColor]);

  function applyLetter(letter) {
    setTitle(letter.title || "");
    setRecipient(letter.recipientName || "");
    setSender(letter.senderName || "");
    setLetterColor(letter.appearance?.letterColor || "#fff8e8");
    setBackgroundColor(letter.appearance?.backgroundColor || "#f4eee5");
    setBorderColor(letter.appearance?.borderColor || "#44352d");
    setBackgroundPattern(letter.appearance?.backgroundPattern || "none");
    setShareMode(letter.share?.accessMode || "both");
    setPasswordEnabled(Boolean(letter.protection?.enabled));
    setHint(letter.protection?.passwordHint || "");
    const textBlock = letter.content?.blocks?.find((block) => block.type === "text");
    const savedStickers = letter.content?.blocks?.filter((block) => block.type === "sticker" && block.value).map((block) => block.value) || [];
    setStickers(savedStickers);
    if (textBlock) {
      setMessage(textBlock.text || "");
      setFont(textBlock.style?.fontFamily || "Sarabun");
      setFontSize(textBlock.style?.fontSize || 18);
      setTextColor(textBlock.style?.color || "#44352d");
      setTextAlign(textBlock.style?.textAlign || "center");
      setFontWeight(textBlock.style?.fontWeight || "normal");
      setFontStyle(textBlock.style?.fontStyle || "normal");
    }
    setQrStyle(letter.share?.qr?.style?.pattern || "rounded");
    setQrForegroundColor(letter.share?.qr?.style?.foregroundColor || "#44352d");
    setQrBackgroundColor(letter.share?.qr?.style?.backgroundColor || "#f8f4ed");
  }

  useEffect(() => {
    if (!publicSlug) return;
    fetch(`${API_URL}/letters/public/${publicSlug}`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      applyLetter(data.letter);
      setUnlocked(!data.locked);
    }).catch((error) => setUnlockError(error.message || "ไม่พบจดหมายนี้"));
  }, [publicSlug]);

  function uploadImage(event) {
    const files = [...event.target.files];
    const next = files.slice(0, 3 - images.length).map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), name: file.name }));
    setImages((current) => [...current, ...next]);
    event.target.value = "";
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function unlock() {
    if (publicSlug) {
      try {
        const response = await fetch(`${API_URL}/letters/public/${publicSlug}/unlock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: unlockInput }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "เปิดจดหมายไม่ได้");
        applyLetter(data.letter);
        setUnlocked(true);
        setUnlockError("");
      } catch (error) { setUnlockError(error.message); }
    } else if (!passwordEnabled || unlockInput === password) {
      setUnlocked(true);
      setUnlockError("");
    } else {
      setUnlockError("รหัสผ่านยังไม่ถูกต้อง ลองดูคำใบ้อีกครั้งนะ");
    }
  }

  function resetEditor() {
    setMode("editor");
    setPublicSlug(null);
    window.history.replaceState({}, "", window.location.pathname);
    setUnlocked(false);
    setUnlockInput("");
    setUnlockError("");
  }

  async function publishLetter() {
    setSaveError("");
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/letters${letterId ? `/${letterId}` : ""}`, {
        method: letterId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("letterly_token")}` },
        body: JSON.stringify({
          title, recipientName: recipient, senderName: sender,
          content: { blocks: [
            { type: "text", text: message, style: { fontFamily: font, fontSize, color: textColor, textAlign, fontWeight, fontStyle } },
            ...stickers.map((value, index) => ({ type: "sticker", value, zIndex: index + 1 })),
          ] },
          appearance: { letterColor, backgroundColor, borderColor, backgroundPattern },
          protection: { enabled: passwordEnabled, password: passwordEnabled ? password : undefined, passwordHint: hint },
          share: { accessMode: shareMode, qr: { enabled: shareMode !== "link", style: { pattern: qrStyle, foregroundColor: qrForegroundColor, backgroundColor: qrBackgroundColor, cornerStyle: qrStyle === "dots" ? "dot" : qrStyle === "rounded" ? "rounded" : "square" } } },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "บันทึกจดหมายไม่ได้");
      setPublicSlug(data.slug);
      setLetterId(data.letter?._id || letterId);
      setShareOpen(true);
    } catch (error) { setSaveError(error.message); }
    finally { setSaving(false); }
  }

  function handleAuth(session) {
    localStorage.setItem("letterly_token", session.token);
    localStorage.setItem("letterly_user", JSON.stringify(session.user));
    setCurrentUser(session.user);
  }

  function logout() {
    localStorage.removeItem("letterly_token");
    localStorage.removeItem("letterly_user");
    setCurrentUser(null);
    setAdminOpen(false);
  }

  if (mode === "recipient") {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-8" style={{ backgroundColor }}>
        <div className="mx-auto flex max-w-5xl justify-between text-sm text-stone-600">
          <button onClick={resetEditor} className="font-semibold hover:text-stone-900">← กลับสู่ตัวแก้ไข</button>
          <span className="font-display text-lg font-semibold text-stone-800">letterly</span>
        </div>
        <section className="mx-auto mt-10 max-w-xl">
          {!unlocked ? (
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(91,69,53,.18)]">
              <div className="relative h-48 bg-[#dcae9b]">
                <div className="absolute inset-x-0 bottom-0 h-32 bg-[#e9b8a4] [clip-path:polygon(0_0,50%_75%,100%_0,100%_100%,0_100%)]" />
                <div className="absolute left-1/2 top-[74px] grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full border-4 border-[#f5d6bf] bg-[#a64b49] text-3xl shadow-lg">💌</div>
              </div>
              <div className="px-8 py-9 text-center sm:px-14">
                <p className="text-sm font-semibold text-[#a64b49]">จดหมายปิดผนึกถึง {recipient}</p>
                <h1 className="mt-2 font-display text-3xl font-semibold text-stone-800">มีจดหมายรอคุณอยู่</h1>
                {passwordEnabled ? <>
                  <p className="mt-6 text-sm text-stone-500">คำใบ้: <span className="font-semibold text-stone-700">{hint || "ไม่มีคำใบ้"}</span></p>
                  <input autoFocus type="password" value={unlockInput} onChange={(e) => setUnlockInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} placeholder="กรอกรหัสผ่าน" className="mt-4 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-center outline-none transition focus:border-[#a64b49] focus:ring-4 focus:ring-[#a64b49]/10" />
                  {unlockError && <p className="mt-3 text-xs font-medium text-rose-600">{unlockError}</p>}
                </> : <p className="mt-6 text-sm text-stone-500">จดหมายนี้พร้อมให้คุณเปิดอ่านแล้ว</p>}
                <button onClick={unlock} className="mt-6 w-full rounded-xl bg-[#a64b49] px-5 py-3 font-bold text-white shadow-lg shadow-[#a64b49]/20 transition hover:-translate-y-0.5 hover:bg-[#8f3d3b]">เปิดผนึกจดหมาย</button>
              </div>
            </div>
          ) : <LetterPreview paperStyle={paperStyle} title={title} message={message} recipient={recipient} sender={sender} fontSize={fontSize} images={images} stickerText={displayStickers} textAlign={textAlign} fontWeight={fontWeight} fontStyle={fontStyle} pattern={backgroundPattern} large />}
        </section>
      </main>
    );
  }

  if (!currentUser) return <AuthScreen onAuthenticated={handleAuth} />;

  if (adminOpen && currentUser.role === "admin") return <AdminDashboard currentUser={currentUser} onClose={() => setAdminOpen(false)} onLogout={logout} />;

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-stone-800">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/90 px-5 backdrop-blur sm:px-8">
        <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#a64b49] text-lg">✉</span><span className="font-display text-xl font-bold">letterly</span></div>
        <div className="hidden items-center gap-2 rounded-full bg-stone-100 p-1 sm:flex"><Pill active>1. ออกแบบ</Pill><Pill>2. แชร์</Pill></div>
        <div className="flex items-center gap-3"><span className="hidden text-sm font-semibold text-stone-600 xl:inline">{currentUser.displayName}</span>{currentUser.role === "admin" && <button onClick={() => setAdminOpen(true)} className="rounded-xl border border-[#a64b49] px-3 py-2 text-xs font-bold text-[#a64b49] hover:bg-[#fff5f0]">Admin</button>}<button disabled={saving} onClick={publishLetter} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-700 disabled:opacity-60">{saving ? "กำลังบันทึก..." : "สร้างลิงก์ส่งต่อ"}</button><button onClick={logout} title="ออกจากระบบ" className="text-xs font-bold text-stone-400 hover:text-rose-600">ออก</button></div>
      </header>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_300px]">
        <aside className="border-b border-stone-200 bg-white p-5 lg:min-h-[calc(100vh-64px)] lg:border-r lg:border-b-0">
          <div className="mb-6"><p className="text-xs font-bold tracking-[.16em] text-[#a64b49]">LETTER STUDIO</p><h1 className="mt-1 font-display text-2xl font-semibold">สร้างจดหมายของคุณ</h1></div>
          <div className="space-y-5">
            <div><Label>ชื่อจดหมาย</Label><input value={title} onChange={(e) => setTitle(e.target.value)} className="field" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>ถึง</Label><input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="field" /></div><div><Label>จาก</Label><input value={sender} onChange={(e) => setSender(e.target.value)} className="field" /></div></div>
            <div><Label>ข้อความในจดหมาย</Label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows="7" className="field resize-none" /></div>
            <div className="rounded-2xl border border-stone-200 p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">🔒 รหัสผ่าน</p><p className="mt-0.5 text-xs text-stone-500">ให้ผู้รับเปิดผนึกก่อนอ่าน</p></div><button onClick={() => setPasswordEnabled(!passwordEnabled)} className={`relative h-6 w-11 rounded-full transition ${passwordEnabled ? "bg-[#a64b49]" : "bg-stone-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${passwordEnabled ? "left-6" : "left-1"}`} /></button></div>
              {passwordEnabled && <div className="mt-4 space-y-3"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="ตั้งรหัสผ่าน" className="field" /><input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="คำใบ้เกี่ยวกับรหัสผ่าน" className="field" /></div>}
            </div>
          </div>
        </aside>

        <section className="flex min-h-[600px] items-center justify-center p-6 sm:p-10" style={{ backgroundColor }}>
          <div className="absolute opacity-30" />
          <div className="w-full max-w-[680px]"><p className="mb-4 text-center text-xs font-bold tracking-[.16em] text-stone-500">ตัวอย่างจดหมาย</p><LetterPreview paperStyle={paperStyle} title={title} message={message} recipient={recipient} sender={sender} fontSize={fontSize} images={images} stickerText={displayStickers} textAlign={textAlign} fontWeight={fontWeight} fontStyle={fontStyle} pattern={backgroundPattern} /></div>
        </section>

        <aside className="border-t border-stone-200 bg-white p-5 lg:min-h-[calc(100vh-64px)] lg:border-t-0 lg:border-l">
          <h2 className="font-display text-xl font-semibold">ปรับแต่ง</h2>
          <div className="mt-5 space-y-6">
            <div><Label>รูปแบบตัวอักษร</Label><select value={font} onChange={(e) => setFont(e.target.value)} className="field">{FONT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select><div className="mt-3 flex items-center gap-3"><span className="text-xs text-stone-500">ขนาด</span><input type="range" min="12" max="32" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="accent-[#a64b49]" /><span className="w-8 text-xs font-bold">{fontSize}</span></div><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={() => setFontWeight(fontWeight === "bold" ? "normal" : "bold")} className={`rounded-lg py-2 text-sm font-bold ${fontWeight === "bold" ? "bg-stone-900 text-white" : "bg-stone-100"}`}>B</button><button onClick={() => setFontStyle(fontStyle === "italic" ? "normal" : "italic")} className={`rounded-lg py-2 text-sm italic ${fontStyle === "italic" ? "bg-stone-900 text-white" : "bg-stone-100"}`}>I</button><select value={textAlign} onChange={(e) => setTextAlign(e.target.value)} className="field py-2"><option value="left">ชิดซ้าย</option><option value="center">กึ่งกลาง</option><option value="right">ชิดขวา</option></select></div></div>
            <ColorControl label="สีตัวอักษร" value={textColor} onChange={setTextColor} /><ColorControl label="สีกระดาษจดหมาย" value={letterColor} onChange={setLetterColor} /><ColorControl label="สีขอบจดหมาย" value={borderColor} onChange={setBorderColor} /><ColorControl label="สีพื้นหลังเว็บ" value={backgroundColor} onChange={setBackgroundColor} /><div><Label>ลวดลายกระดาษ</Label><select value={backgroundPattern} onChange={(e) => setBackgroundPattern(e.target.value)} className="field"><option value="none">เรียบ</option><option value="dots">จุด</option><option value="lines">เส้น</option><option value="hearts">หัวใจ</option></select></div>
            <div><Label>รูปภาพประกอบ</Label><input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={uploadImage} /><button onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 py-3 text-sm font-semibold text-stone-600 hover:border-[#a64b49] hover:text-[#a64b49]"><Icon>＋</Icon> เพิ่มรูปภาพ</button>{images.length > 0 && <div className="mt-2 flex gap-2">{images.map((image) => <div key={image.id} className="group relative"><img src={image.url} alt="รูปที่อัปโหลด" className="h-12 w-12 rounded-lg object-cover" /><button onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))} className="absolute -right-1 -top-1 hidden h-4 w-4 rounded-full bg-stone-900 text-[10px] text-white group-hover:block">×</button></div>)}</div>}</div>
            <div><Label>สติกเกอร์</Label><div className="grid grid-cols-4 gap-2">{STICKERS.map((sticker) => <button key={sticker} onClick={() => setStickers((current) => current.includes(sticker) ? current.filter((item) => item !== sticker) : [...current, sticker])} className={`grid aspect-square place-items-center rounded-xl text-xl transition ${stickers.includes(sticker) ? "bg-[#f7ded1] ring-2 ring-[#a64b49]" : "bg-stone-100 hover:bg-stone-200"}`}>{sticker}</button>)}</div></div>
          </div>
        </aside>
      </div>

      {saveError && <p className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">{saveError}</p>}
      {shareOpen && <ShareModal close={() => setShareOpen(false)} shareMode={shareMode} setShareMode={setShareMode} qrStyle={qrStyle} setQrStyle={setQrStyle} qrForegroundColor={qrForegroundColor} setQrForegroundColor={setQrForegroundColor} qrBackgroundColor={qrBackgroundColor} setQrBackgroundColor={setQrBackgroundColor} shareUrl={shareUrl} copyLink={copyLink} copied={copied} openRecipient={() => { setShareOpen(false); setMode("recipient"); }} />}
    </main>
  );
}

function ColorControl({ label, value, onChange }) {
  return <div><Label>{label}</Label><div className="flex items-center gap-3"><input aria-label={label} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0" /><input value={value} onChange={(e) => onChange(e.target.value)} className="field uppercase" /></div></div>;
}

function LetterPreview({ paperStyle, title, message, recipient, sender, fontSize, images, stickerText, textAlign, fontWeight, fontStyle, pattern, large = false }) {
  const patterns = { dots: "radial-gradient(currentColor 1px, transparent 1px)", lines: "repeating-linear-gradient(0deg, transparent, transparent 27px, currentColor 28px)", hearts: "radial-gradient(currentColor 1px, transparent 1px)" };
  const patternStyle = pattern === "none" ? paperStyle : { ...paperStyle, backgroundImage: patterns[pattern], backgroundSize: pattern === "dots" || pattern === "hearts" ? "20px 20px" : "100% 28px" };
  return <article style={patternStyle} className={`relative overflow-hidden rounded-sm p-8 shadow-[0_20px_45px_rgba(86,67,49,.2)] sm:p-12 ${large ? "min-h-[520px]" : "min-h-[530px]"}`}>
    <div className="absolute inset-3 border opacity-25" style={{ borderColor: paperStyle.borderColor }} />
    <div className="relative flex h-full min-h-[440px] flex-col items-center" style={{ textAlign }}>
      <div className="text-3xl">{stickerText || "💌"}</div>
      <p className="mt-5 text-sm opacity-70">ถึง {recipient || "คนพิเศษ"}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{title || "จดหมายของฉัน"}</h2>
      <div className="my-7 h-px w-20 bg-current opacity-30" />
      <p className="max-w-md whitespace-pre-line leading-8 opacity-90" style={{ fontSize: `${fontSize}px`, fontWeight, fontStyle }}>{message || "เริ่มเขียนข้อความของคุณตรงนี้..."}</p>
      {images.length > 0 && <div className="mt-7 flex flex-wrap justify-center gap-3">{images.map((image) => <img key={image.id} src={image.url} alt={image.name} className="h-24 w-24 rounded-lg border-4 border-white/60 object-cover shadow-md" />)}</div>}
      <p className="mt-auto pt-10 text-sm font-semibold opacity-80">{sender || "จากผู้ส่ง"}</p>
    </div>
  </article>;
}

function ShareModal({ close, shareMode, setShareMode, qrStyle, setQrStyle, qrForegroundColor, setQrForegroundColor, qrBackgroundColor, setQrBackgroundColor, shareUrl, copyLink, copied, openRecipient }) {
  const showQr = shareMode !== "link";
  const showLink = shareMode !== "qr";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/35 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold tracking-[.14em] text-[#a64b49]">พร้อมส่งแล้ว</p><h2 className="mt-1 font-display text-3xl font-semibold">ส่งจดหมายของคุณ</h2></div><button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-lg hover:bg-stone-200">×</button></div>
    <div className="mt-6 flex gap-2"><Pill active={shareMode === "both"} onClick={() => setShareMode("both")}>ทั้งคู่</Pill><Pill active={shareMode === "link"} onClick={() => setShareMode("link")}>ลิงก์</Pill><Pill active={shareMode === "qr"} onClick={() => setShareMode("qr")}>QR code</Pill></div>
    {showQr && <div className="mt-6 rounded-2xl p-5 text-center" style={{ backgroundColor: qrBackgroundColor }}><QRCodeSVG value={shareUrl} size={164} level="H" bgColor={qrBackgroundColor} fgColor={qrForegroundColor} marginSize={2} /><div className="mt-4 flex justify-center gap-2"><Pill active={qrStyle === "square"} onClick={() => setQrStyle("square")}>Square</Pill><Pill active={qrStyle === "rounded"} onClick={() => setQrStyle("rounded")}>Rounded</Pill><Pill active={qrStyle === "dots"} onClick={() => setQrStyle("dots")}>Dots</Pill></div><div className="mt-4 grid grid-cols-2 gap-3 text-left"><ColorControl label="สี QR" value={qrForegroundColor} onChange={setQrForegroundColor} /><ColorControl label="สีพื้น QR" value={qrBackgroundColor} onChange={setQrBackgroundColor} /></div><p className="mt-3 text-xs text-stone-500">สแกนเพื่อเปิดจดหมาย</p></div>}
    {showLink && <div className="mt-5"><Label>ลิงก์สำหรับส่งให้ผู้รับ</Label><div className="flex gap-2"><input readOnly value={shareUrl} className="field min-w-0" /><button onClick={copyLink} className="shrink-0 rounded-xl bg-stone-900 px-4 text-sm font-bold text-white">{copied ? "คัดลอกแล้ว" : "คัดลอก"}</button></div></div>}
    <button onClick={openRecipient} className="mt-6 w-full rounded-xl border border-stone-200 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50">ดูหน้าที่ผู้รับจะเห็น →</button>
  </div></div>;
}

function AdminDashboard({ currentUser, onClose, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const token = localStorage.getItem("letterly_token");

  useEffect(() => {
    fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
        setUsers(data.users);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [token]);

  function editUser(id, field, value) {
    setUsers((items) => items.map((user) => user._id === id ? { ...user, [field]: value } : user));
  }

  async function saveUser(user) {
    setSavingId(user._id);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: user.displayName, email: user.email, role: user.role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "บันทึกข้อมูลผู้ใช้ไม่ได้");
      setUsers((items) => items.map((item) => item._id === user._id ? data.user : item));
    } catch (requestError) { setError(requestError.message); }
    finally { setSavingId(null); }
  }

  return <main className="min-h-screen bg-[#f8f7f4] p-5 text-stone-800 sm:p-8"><div className="mx-auto max-w-5xl"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-[.16em] text-[#a64b49]">ADMIN CONSOLE</p><h1 className="mt-1 font-display text-3xl font-semibold">จัดการผู้ใช้งาน</h1><p className="mt-1 text-sm text-stone-500">แก้ไขชื่อ อีเมล และสิทธิ์การใช้งาน</p></div><div className="flex gap-2"><button onClick={onClose} className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold hover:bg-stone-50">กลับหน้าออกแบบ</button><button onClick={onLogout} className="rounded-xl px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">ออกจากระบบ</button></div></header>{error && <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}<section className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-4">ชื่อ</th><th className="px-5 py-4">อีเมล</th><th className="px-5 py-4">สิทธิ์</th><th className="px-5 py-4">ดำเนินการ</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="px-5 py-10 text-center text-stone-500">กำลังโหลดข้อมูล...</td></tr> : users.map((user) => <tr key={user._id} className="border-b border-stone-100 last:border-0"><td className="px-5 py-3"><input value={user.displayName} onChange={(e) => editUser(user._id, "displayName", e.target.value)} className="field" /></td><td className="px-5 py-3"><input type="email" value={user.email} onChange={(e) => editUser(user._id, "email", e.target.value)} className="field" /></td><td className="px-5 py-3"><select value={user.role} disabled={user._id === currentUser._id} onChange={(e) => editUser(user._id, "role", e.target.value)} className="field disabled:cursor-not-allowed disabled:opacity-50"><option value="user">User</option><option value="admin">Admin</option></select></td><td className="px-5 py-3"><button disabled={savingId === user._id} onClick={() => saveUser(user)} className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{savingId === user._id ? "กำลังบันทึก" : "บันทึก"}</button></td></tr>)}</tbody></table></section></div></main>;
}

function AuthScreen({ onAuthenticated }) {
  const [isRegister, setIsRegister] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { displayName, email, password, adminCode: adminCode || undefined } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ไม่สามารถดำเนินการได้");
      onAuthenticated(data);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "เชื่อมต่อ server ไม่ได้ กรุณาเปิด server ที่ port 5000" : requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen bg-[#f4eee5] lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-[#a64b49] p-14 text-[#fff8e8] lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[#e9b8a4]/30" /><div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full border-[40px] border-[#f7d9c8]/20" />
      <div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff8e8] text-xl text-[#a64b49]">✉</span><span className="font-display text-2xl font-bold">letterly</span></div>
      <div className="relative max-w-md"><p className="text-sm font-bold tracking-[.2em] text-[#f7d9c8]">A LITTLE PLACE FOR BIG FEELINGS</p><h1 className="mt-5 font-display text-5xl font-semibold leading-tight">ส่งความรู้สึก<br />ในรูปแบบจดหมาย</h1><p className="mt-6 max-w-sm text-lg leading-8 text-[#ffece0]/85">ออกแบบจดหมายส่วนตัว ปิดผนึกด้วยรหัสผ่าน แล้วส่งให้คนสำคัญของคุณ</p></div>
      <p className="relative text-sm text-[#ffece0]/60">สร้างจดหมายที่คนรับจะอยากเก็บไว้เสมอ</p>
    </section>
    <section className="flex items-center justify-center px-5 py-10 sm:p-10"><div className="w-full max-w-md"><div className="mb-8 text-center lg:hidden"><span className="font-display text-3xl font-bold">letterly</span></div><p className="text-xs font-bold tracking-[.16em] text-[#a64b49]">WELCOME TO LETTERLY</p><h2 className="mt-2 font-display text-4xl font-semibold text-stone-800">{isRegister ? "เริ่มต้นสร้างจดหมาย" : "ยินดีต้อนรับกลับมา"}</h2><p className="mt-2 text-sm text-stone-500">{isRegister ? "สร้างบัญชีเพื่อบันทึกและจัดการจดหมายของคุณ" : "เข้าสู่ระบบเพื่อสร้างจดหมายถึงคนพิเศษ"}</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {isRegister && <div><Label>ชื่อที่แสดง</Label><input required minLength="2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="เช่น มินท์" className="field" /></div>}
        <div><Label>อีเมล</Label><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" /></div>
        <div><Label>รหัสผ่าน</Label><input required minLength="8" type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" className="field" /></div>
        {isRegister && <div><Label>Admin activation code <span className="font-normal text-stone-400">(เฉพาะผู้ดูแล)</span></Label><input type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="เว้นว่างสำหรับบัญชีผู้ใช้ทั่วไป" className="field" /></div>}
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-[#a64b49] py-3.5 font-bold text-white shadow-lg shadow-[#a64b49]/20 transition hover:bg-[#8f3d3b] disabled:cursor-wait disabled:opacity-60">{loading ? "กำลังดำเนินการ..." : isRegister ? "สร้างบัญชีและเริ่มออกแบบ" : "เข้าสู่ระบบ"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">{isRegister ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"} <button onClick={() => { setIsRegister(!isRegister); setError(""); }} className="font-bold text-[#a64b49] hover:underline">{isRegister ? "เข้าสู่ระบบ" : "สมัครใช้งาน"}</button></p>
    </div></section>
  </main>;
}
