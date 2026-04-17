#!/usr/bin/env python3
"""Boss Rush — Editeur de Cartes JSON (tkinter)

Lit et ecrit directement les fichiers JSON du dossier Data/cartes/.
Double-cliquer sur l'exe ou lancer le .py depuis le dossier Data/editeur/.
"""

import json
import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
from pathlib import Path

# ── Resolve DATA_DIR ─────────────────────────────────────────
# Works both when running as .py and as frozen .exe
# Editor lives in Data/editeur/, JSON cards live in Data/cartes/
if getattr(sys, "frozen", False):
    BASE = Path(sys.executable).parent
else:
    BASE = Path(__file__).parent

DATA_DIR = BASE.parent / "cartes"
# Docs lives at the project root: BossRush/Assets/Data/editeur/ -> ../../../../Docs
DOCS_DIR = BASE.parent.parent.parent.parent / "Docs"

# ── Icon system ──────────────────────────────────────────────
# Each entry: (balise_tag, display_label, emoji_for_display)
# The balise <ico:tag> is what gets inserted in JSON and parsed by Unity.
ICONS = [
    ("menace",      "Menace",            "🃏"),
    ("invocation",  "Invocation",        "🐾"),
    ("attaque",     "Ord. attaque",      "⚔"),
    ("actif_boss",  "Actif boss",        "⚡"),
    ("degat",       "Degat / blessure",  "🩸"),
    ("action",      "Carte Action",      "🎴"),
    ("capacite",    "Cap. active heros", "💠"),
    ("destin",      "Carte Destin",      "🔮"),
    ("chasse",      "Carte Chasse",      "🏹"),
]

# Regex for rendering preview: <ico:tag> -> emoji label
import re
ICO_PATTERN = re.compile(r"<ico:(\w+)>")
_ICO_MAP = {tag: (emoji, label) for tag, label, emoji in ICONS}

def _render_preview(text):
    """Replace <ico:tag> balises with [emoji Label] for human-readable preview."""
    if not text:
        return ""
    def _repl(m):
        t = m.group(1)
        if t in _ICO_MAP:
            e, l = _ICO_MAP[t]
            return f"[{e} {l}]"
        return m.group(0)  # unknown tag: keep as-is
    return ICO_PATTERN.sub(_repl, text)

# ── Tab / schema definitions ─────────────────────────────────
TABS = [
    {
        "key": "heroes",
        "label": "Heroes",
        "file": "heroes.json",
        "data_key": "heroes",
        "cols": [
            ("id", "ID", "text"),
            ("nom", "Nom", "text"),
            ("titre", "Titre", "text"),
            ("vie", "Vie", "int"),
            ("competences", "Competences", "tags"),
            ("capacite_speciale", "Cap. Speciale", "long"),
            ("citation", "Citation", "long"),
        ],
        "defaults": {"id": "", "nom": "", "titre": "", "vie": 4, "competences": [], "capacite_speciale": "", "citation": ""},
    },
    {
        "key": "boss",
        "label": "Boss",
        "file": "boss.json",
        "data_key": "boss",
        "cols": [
            ("id", "ID", "text"),
            ("nom", "Nom", "text"),
            ("difficulte", "Difficulte", "select:facile,moyen,difficile,très difficile"),
            ("vie_multiplicateur", "PV x", "int"),
            ("stats.sequence", "Sequence", "tags"),
            ("stats.passif", "Passif", "long"),
            ("stats.actif", "Actif", "long"),
            ("monstres_ids", "Monstres IDs", "tags"),
            ("lore_md", "Fichier MD (Docs/)", "text"),
            ("lore", "Lore (reference + jeu + citation)", "long"),
        ],
        "defaults": {"id": "", "nom": "", "difficulte": "facile", "vie_multiplicateur": 5,
                     "stats": {"sequence": [], "passif": "", "actif": ""}, "monstres_ids": [],
                     "lore_md": "", "lore": ""},
    },
    {
        "key": "monstres",
        "label": "Monstres",
        "file": "monstres.json",
        "data_key": "monstres",
        "cols": [
            ("id", "ID", "text"),
            ("nom", "Nom", "text"),
            ("vie", "Vie", "int"),
            ("degats", "Degats", "int"),
            ("capacite_speciale", "Cap. Speciale", "long-null"),
            ("description", "Description", "long"),
            ("citation", "Citation", "text"),
            ("quantite", "Qte", "int"),
        ],
        "defaults": {"id": "", "nom": "", "vie": 1, "degats": 1, "capacite_speciale": None, "description": "", "citation": "", "quantite": 1},
    },
    {
        "key": "chasse",
        "label": "Chasse",
        "file": "cartes_Chasse.json",
        "data_key": "cartes_arsenal",
        "cols": [
            ("id", "ID", "text"),
            ("nom", "Nom", "text"),
            ("categorie", "Cat.", "select:action,objet"),
            ("degats", "Degats", "int-opt"),
            ("bonus_degats", "Bonus", "int-opt"),
            ("prerequis", "Prerequis", "select:Nawel,Daraa,Gao,Isonash,Aslan"),
            ("effet", "Effet", "long"),
            ("quantite", "Qte", "int"),
        ],
        "defaults": {"id": "", "nom": "", "categorie": "action", "prerequis": "Nawel", "effet": "", "quantite": 1},
    },
    {
        "key": "menaces",
        "label": "Menaces",
        "file": "Menaces.json",
        "data_key": "epreuves",
        "cols": [
            ("id", "ID", "text"),
            ("type", "Type", "select:assaut,evenement"),
            ("sous_type", "Sous-type", "select-opt:attaque,ordre_attaque,actif_boss,soin,combo"),
            ("nom", "Nom", "text"),
            ("degats", "Degats", "int-opt"),
            ("description", "Description", "long"),
        ],
        "defaults": {"id": "", "type": "assaut", "nom": "", "description": ""},
    },
    {
        "key": "destins",
        "label": "Destins",
        "file": "destins.json",
        "data_key": "destins",
        "cols": [
            ("id", "ID", "text"),
            ("type", "Type", "select:positif,negatif,ambigu"),
            ("titre", "Titre", "text"),
            ("degats", "Degats", "int-opt"),
            ("effet", "Effet", "long"),
            ("lore", "Lore (citation)", "long"),
        ],
        "defaults": {"id": "", "type": "ambigu", "titre": "", "effet": "", "lore": ""},
    },
]


# ── Nested get/set helpers ───────────────────────────────────
def get_val(item, field_key):
    parts = field_key.split(".")
    v = item
    for p in parts:
        if isinstance(v, dict):
            v = v.get(p)
        else:
            return None
    return v


def set_val(item, field_key, val):
    parts = field_key.split(".")
    obj = item
    for p in parts[:-1]:
        if p not in obj or not isinstance(obj[p], dict):
            obj[p] = {}
        obj = obj[p]
    obj[parts[-1]] = val


# ── Main application ─────────────────────────────────────────
class CardEditorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Boss Rush — Editeur de Cartes")
        self.geometry("1400x820")
        self.configure(bg="#1a1a2e")
        self.minsize(900, 500)

        # State
        self.data = {}  # key -> {"meta": ..., "items": [...]}
        self.dirty = set()  # keys with unsaved changes
        self._last_text_widget = None  # last focused tk.Text or ttk.Entry
        self._last_text_index = None   # cursor position at last focus
        self.filter_vars = {}  # for chasse filters

        self._build_styles()
        self._build_icon_bar()
        self._build_notebook()
        self._load_all()

    # ── Styles ────────────────────────────────────────────
    def _build_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        bg = "#1a1a2e"
        bg2 = "#16213e"
        bg3 = "#0f3460"
        accent = "#e94560"
        text = "#eeeeee"
        text2 = "#aaaabb"
        inputbg = "#222233"

        style.configure(".", background=bg, foreground=text, fieldbackground=inputbg,
                        bordercolor="#334455", insertcolor=text)
        style.configure("TNotebook", background=bg, borderwidth=0)
        style.configure("TNotebook.Tab", background=bg2, foreground=text2, padding=[14, 6],
                        font=("Segoe UI", 10, "bold"))
        style.map("TNotebook.Tab",
                  background=[("selected", bg3)],
                  foreground=[("selected", accent)])
        style.configure("TFrame", background=bg)
        style.configure("TLabel", background=bg, foreground=text, font=("Segoe UI", 9))
        style.configure("TButton", background=bg3, foreground=text, font=("Segoe UI", 9, "bold"),
                        padding=[8, 4])
        style.map("TButton", background=[("active", accent)])
        style.configure("Accent.TButton", background=accent, foreground="#fff")
        style.map("Accent.TButton", background=[("active", "#ff6680")])
        style.configure("Save.TButton", background="#2ecc71", foreground="#fff")
        style.map("Save.TButton", background=[("active", "#3ddc84")])
        style.configure("Del.TButton", background="#e74c3c", foreground="#fff", padding=[4, 2])
        style.map("Del.TButton", background=[("active", "#ff5555")])
        style.configure("Treeview", background=inputbg, foreground=text, fieldbackground=inputbg,
                        rowheight=28, font=("Segoe UI", 9))
        style.configure("Treeview.Heading", background=bg3, foreground=accent,
                        font=("Segoe UI", 9, "bold"))
        style.map("Treeview", background=[("selected", bg3)], foreground=[("selected", "#fff")])

        style.configure("Meta.TLabel", background=bg2, foreground=text2, font=("Segoe UI", 8),
                        padding=[8, 4])
        style.configure("Icon.TButton", background=inputbg, foreground=text,
                        font=("Segoe UI", 10), padding=[6, 2])
        style.map("Icon.TButton", background=[("active", "#333")])
        style.configure("Info.TLabel", background=bg, foreground=text2, font=("Segoe UI", 8))
        style.configure("Filter.TEntry", fieldbackground=inputbg, foreground=text)

    # ── Icon palette ──────────────────────────────────────
    def _build_icon_bar(self):
        bar = ttk.Frame(self)
        bar.pack(fill="x", padx=8, pady=(8, 0))
        ttk.Label(bar, text="Inserer :").pack(side="left", padx=(0, 6))
        for tag, label, emoji in ICONS:
            btn = ttk.Button(bar, text=f"{emoji} {label}", style="Icon.TButton",
                             command=lambda t=tag: self._insert_icon(t))
            btn.pack(side="left", padx=2)

        # Right side: global save
        ttk.Button(bar, text="Tout sauvegarder", style="Save.TButton",
                   command=self._save_all).pack(side="right", padx=4)

    def _track_focus(self, widget):
        """Bind focus/cursor tracking on a text widget so icon buttons work."""
        if isinstance(widget, tk.Text):
            widget.bind("<FocusIn>", lambda e, w=widget: self._save_cursor(w), add="+")
            widget.bind("<ButtonRelease-1>", lambda e, w=widget: self._save_cursor(w), add="+")
            widget.bind("<KeyRelease>", lambda e, w=widget: self._save_cursor(w), add="+")
        elif isinstance(widget, ttk.Entry):
            widget.bind("<FocusIn>", lambda e, w=widget: self._save_cursor(w), add="+")
            widget.bind("<ButtonRelease-1>", lambda e, w=widget: self._save_cursor(w), add="+")
            widget.bind("<KeyRelease>", lambda e, w=widget: self._save_cursor(w), add="+")

    def _save_cursor(self, widget):
        self._last_text_widget = widget
        if isinstance(widget, tk.Text):
            self._last_text_index = widget.index("insert")
        elif isinstance(widget, ttk.Entry):
            self._last_text_index = widget.index("insert")

    def _insert_icon(self, tag):
        """Insert <ico:tag> balise at last known cursor position."""
        balise = f"<ico:{tag}>"
        w = self._last_text_widget
        if w is None:
            return
        if isinstance(w, tk.Text):
            idx = self._last_text_index or "insert"
            w.insert(idx, balise)
            # Move cursor after inserted text
            new_idx = w.index(f"{idx} + {len(balise)}c")
            w.mark_set("insert", new_idx)
            self._last_text_index = new_idx
            w.focus_set()
            w.event_generate("<<Modified>>")
        elif isinstance(w, ttk.Entry):
            pos = self._last_text_index or 0
            w.insert(pos, balise)
            new_pos = pos + len(balise)
            w.icursor(new_pos)
            self._last_text_index = new_pos
            w.focus_set()

    # ── Notebook (tabs) ───────────────────────────────────
    def _build_notebook(self):
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=8, pady=8)

        self.tab_frames = {}
        self.tree_widgets = {}
        self.detail_frames = {}

        for tab in TABS:
            frame = ttk.Frame(self.notebook)
            self.notebook.add(frame, text=f" {tab['label']} ")
            self.tab_frames[tab["key"]] = frame
            self._build_tab(tab, frame)

    def _build_tab(self, tab, parent):
        key = tab["key"]

        # Top bar
        top = ttk.Frame(parent)
        top.pack(fill="x", padx=4, pady=4)

        ttk.Button(top, text="Sauvegarder", style="Save.TButton",
                   command=lambda: self._save_one(key)).pack(side="left", padx=2)
        ttk.Button(top, text="Recharger", command=lambda: self._load_one(key)).pack(side="left", padx=2)
        ttk.Button(top, text="+ Ajouter", style="Accent.TButton",
                   command=lambda: self._add_item(key)).pack(side="left", padx=8)

        self.data[key] = {"info_label": None}
        lbl = ttk.Label(top, text="", style="Info.TLabel")
        lbl.pack(side="right", padx=4)
        self.data[key]["info_label"] = lbl

        # Filter for chasse
        if key == "chasse":
            fbar = ttk.Frame(parent)
            fbar.pack(fill="x", padx=4)
            ttk.Label(fbar, text="Filtre:").pack(side="left")
            fv = tk.StringVar()
            self.filter_vars["chasse_text"] = fv
            e = ttk.Entry(fbar, textvariable=fv, width=25)
            e.pack(side="left", padx=4)
            fv.trace_add("write", lambda *_: self._apply_filter(key))
            ttk.Label(fbar, text="Heros:").pack(side="left", padx=(12, 0))
            hv = tk.StringVar(value="Tous")
            self.filter_vars["chasse_hero"] = hv
            cb = ttk.Combobox(fbar, textvariable=hv, values=["Tous", "Nawel", "Daraa", "Gao", "Isonash", "Aslan"],
                              state="readonly", width=10)
            cb.pack(side="left", padx=4)
            hv.trace_add("write", lambda *_: self._apply_filter(key))

        # Meta label
        meta_lbl = ttk.Label(parent, text="", style="Meta.TLabel", wraplength=1300, anchor="w")
        meta_lbl.pack(fill="x", padx=4, pady=(2, 0))
        self.data[key]["meta_label"] = meta_lbl

        # Paned: list left, detail right
        paned = ttk.PanedWindow(parent, orient="horizontal")
        paned.pack(fill="both", expand=True, padx=4, pady=4)

        # Left: treeview list
        left = ttk.Frame(paned)
        paned.add(left, weight=1)

        cols_display = ("id", "nom_display")
        tree = ttk.Treeview(left, columns=cols_display, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("nom_display", text="Nom / Resume")
        tree.column("id", width=100, minwidth=80)
        tree.column("nom_display", width=200, minwidth=120)

        vsb = ttk.Scrollbar(left, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        tree.bind("<<TreeviewSelect>>", lambda e, k=key: self._on_select(k))
        self.tree_widgets[key] = tree

        # Right: detail panel
        right_outer = ttk.Frame(paned)
        paned.add(right_outer, weight=3)

        canvas = tk.Canvas(right_outer, bg="#1a1a2e", highlightthickness=0)
        scrollbar = ttk.Scrollbar(right_outer, orient="vertical", command=canvas.yview)
        detail = ttk.Frame(canvas)
        detail.bind("<Configure>", lambda e, c=canvas: c.configure(scrollregion=c.bbox("all")))
        canvas.create_window((0, 0), window=detail, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        canvas.pack(side="left", fill="both", expand=True)

        # Mousewheel scroll
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel, add="+")

        self.detail_frames[key] = {"frame": detail, "widgets": {}, "canvas": canvas}

    # ── Loading ───────────────────────────────────────────
    def _resolve_path(self, tab):
        return DATA_DIR / tab["file"]

    def _load_all(self):
        for tab in TABS:
            self._load_one(tab["key"])

    def _load_one(self, key):
        tab = next(t for t in TABS if t["key"] == key)
        path = self._resolve_path(tab)
        if not path.exists():
            messagebox.showwarning("Fichier manquant", f"{path} introuvable.")
            self.data[key]["meta"] = None
            self.data[key]["items"] = []
            self._refresh_list(key)
            return

        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        self.data[key]["meta"] = raw.get("meta")
        self.data[key]["items"] = raw.get(tab["data_key"], [])
        self.dirty.discard(key)
        self._refresh_meta(key)
        self._refresh_list(key)
        self._clear_detail(key)
        n = len(self.data[key]["items"])
        self.data[key]["info_label"].configure(text=f"{tab['file']} — {n} cartes")

    def _refresh_meta(self, key):
        meta = self.data[key].get("meta")
        lbl = self.data[key]["meta_label"]
        if meta:
            parts = [f"{k}: {v}" for k, v in meta.items()]
            lbl.configure(text="  |  ".join(parts))
        else:
            lbl.configure(text="")

    # ── List refresh ──────────────────────────────────────
    def _refresh_list(self, key):
        tree = self.tree_widgets[key]
        tree.delete(*tree.get_children())
        items = self.data[key].get("items", [])
        for i, item in enumerate(items):
            iid = str(i)
            display = item.get("nom") or item.get("titre") or item.get("effet", "")[:50] or "—"
            tree.insert("", "end", iid=iid, values=(item.get("id", ""), display))
        if key == "chasse":
            self._apply_filter(key)

    def _apply_filter(self, key):
        if key != "chasse":
            return
        tree = self.tree_widgets[key]
        items = self.data[key].get("items", [])
        ft = self.filter_vars.get("chasse_text", tk.StringVar()).get().lower()
        fh = self.filter_vars.get("chasse_hero", tk.StringVar()).get()

        # Detach all, then re-insert matching
        all_iids = [str(i) for i in range(len(items))]
        for iid in all_iids:
            tree.detach(iid)

        for i, item in enumerate(items):
            show = True
            if ft:
                haystack = f"{item.get('id','')} {item.get('nom','')} {item.get('effet','')}".lower()
                show = ft in haystack
            if show and fh and fh != "Tous":
                show = item.get("prerequis") == fh
            if show:
                tree.reattach(str(i), "", "end")

    # ── Selection / Detail ────────────────────────────────
    def _on_select(self, key):
        tree = self.tree_widgets[key]
        sel = tree.selection()
        if not sel:
            return
        idx = int(sel[0])
        self._show_detail(key, idx)

    def _clear_detail(self, key):
        frame = self.detail_frames[key]["frame"]
        for w in frame.winfo_children():
            w.destroy()
        self.detail_frames[key]["widgets"] = {}

    def _show_detail(self, key, idx):
        self._clear_detail(key)
        tab = next(t for t in TABS if t["key"] == key)
        item = self.data[key]["items"][idx]
        frame = self.detail_frames[key]["frame"]
        widgets = {}

        row = 0
        for field_key, label, ftype in tab["cols"]:
            ttk.Label(frame, text=label, font=("Segoe UI", 9, "bold")).grid(
                row=row, column=0, sticky="ne", padx=(8, 8), pady=4)

            val = get_val(item, field_key)
            w = self._build_field(frame, key, idx, field_key, ftype, val)
            w.grid(row=row, column=1, sticky="we", padx=(0, 8), pady=4)
            widgets[field_key] = w
            row += 1

        frame.columnconfigure(1, weight=1)

        # Delete button
        ttk.Button(frame, text="Supprimer cette carte", style="Del.TButton",
                   command=lambda: self._delete_item(key, idx)).grid(
            row=row, column=0, columnspan=2, pady=12)

        self.detail_frames[key]["widgets"] = widgets

    def _build_field(self, parent, key, idx, field_key, ftype, val):
        item = self.data[key]["items"][idx]

        def on_change(*_):
            self.dirty.add(key)

        if ftype == "text":
            var = tk.StringVar(value=val or "")
            var.trace_add("write", lambda *_: (set_val(item, field_key, var.get()), on_change()))
            e = ttk.Entry(parent, textvariable=var, width=40)
            self._track_focus(e)
            return e

        if ftype == "int":
            var = tk.StringVar(value=str(val if val is not None else 0))
            def _set_int(*_):
                try:
                    set_val(item, field_key, int(var.get()))
                except ValueError:
                    pass
                on_change()
            var.trace_add("write", _set_int)
            e = ttk.Entry(parent, textvariable=var, width=8)
            return e

        if ftype == "int-opt":
            fr = ttk.Frame(parent)
            enabled = tk.BooleanVar(value=val is not None)
            var = tk.StringVar(value=str(val) if val is not None else "")
            cb = ttk.Checkbutton(fr, variable=enabled)
            cb.pack(side="left")
            e = ttk.Entry(fr, textvariable=var, width=8)
            e.pack(side="left", padx=4)
            def _upd(*_):
                if enabled.get():
                    try:
                        set_val(item, field_key, int(var.get()))
                    except ValueError:
                        pass
                else:
                    # Remove key from item
                    parts = field_key.split(".")
                    obj = item
                    for p in parts[:-1]:
                        obj = obj.get(p, {})
                    obj.pop(parts[-1], None)
                    var.set("")
                on_change()
            enabled.trace_add("write", _upd)
            var.trace_add("write", _upd)
            return fr

        if ftype == "long":
            fr = ttk.Frame(parent)
            txt = tk.Text(fr, width=60, height=3, bg="#222233", fg="#eeeeee",
                          insertbackground="#eee", font=("Segoe UI", 9),
                          wrap="word", relief="flat", borderwidth=2)
            txt.insert("1.0", val or "")
            txt.pack(fill="x", expand=True)
            self._track_focus(txt)
            preview = tk.Label(fr, text="", bg="#0f3460", fg="#aaaabb",
                               font=("Segoe UI", 8), anchor="w", justify="left",
                               wraplength=600, padx=6, pady=2)
            preview.pack(fill="x")
            def _save_text(*_, _txt=txt, _prev=preview):
                raw = _txt.get("1.0", "end-1c")
                set_val(item, field_key, raw)
                _prev.configure(text=_render_preview(raw))
                on_change()
            txt.bind("<<Modified>>", lambda e, t=txt: (t.edit_modified(False), _save_text()))
            txt.bind("<KeyRelease>", lambda e: _save_text())
            preview.configure(text=_render_preview(val or ""))
            return fr

        if ftype == "long-null":
            fr = ttk.Frame(parent)
            enabled = tk.BooleanVar(value=val is not None)
            cb = ttk.Checkbutton(fr, variable=enabled, text="Actif")
            cb.pack(anchor="w")
            txt = tk.Text(fr, width=60, height=3, bg="#222233", fg="#eeeeee",
                          insertbackground="#eee", font=("Segoe UI", 9),
                          wrap="word", relief="flat", borderwidth=2)
            txt.insert("1.0", val or "")
            if val is None:
                txt.configure(state="disabled")
            txt.pack(fill="x", expand=True)
            self._track_focus(txt)
            preview = tk.Label(fr, text="", bg="#0f3460", fg="#aaaabb",
                               font=("Segoe UI", 8), anchor="w", justify="left",
                               wraplength=600, padx=6, pady=2)
            preview.pack(fill="x")
            def _upd_null(*_, _en=enabled, _txt=txt, _prev=preview):
                if _en.get():
                    _txt.configure(state="normal")
                    raw = _txt.get("1.0", "end-1c")
                    set_val(item, field_key, raw)
                    _prev.configure(text=_render_preview(raw))
                else:
                    _txt.configure(state="disabled")
                    set_val(item, field_key, None)
                    _prev.configure(text="")
                on_change()
            enabled.trace_add("write", _upd_null)
            txt.bind("<KeyRelease>", lambda e: _upd_null())
            preview.configure(text=_render_preview(val or "") if val is not None else "")
            return fr

        if ftype.startswith("select:"):
            opts = ftype.split(":", 1)[1].split(",")
            var = tk.StringVar(value=val or opts[0])
            var.trace_add("write", lambda *_: (set_val(item, field_key, var.get()), on_change()))
            cb = ttk.Combobox(parent, textvariable=var, values=opts, state="readonly", width=18)
            return cb

        if ftype.startswith("select-opt:"):
            opts = ftype.split(":", 1)[1].split(",")
            fr = ttk.Frame(parent)
            enabled = tk.BooleanVar(value=val is not None)
            cb_en = ttk.Checkbutton(fr, variable=enabled)
            cb_en.pack(side="left")
            var = tk.StringVar(value=val or "")
            cb = ttk.Combobox(fr, textvariable=var, values=[""] + opts, state="readonly", width=16)
            cb.pack(side="left", padx=4)
            def _upd_sel(*_):
                if enabled.get():
                    v = var.get()
                    set_val(item, field_key, v if v else None)
                else:
                    parts = field_key.split(".")
                    obj = item
                    for p in parts[:-1]:
                        obj = obj.get(p, {})
                    obj.pop(parts[-1], None)
                    var.set("")
                on_change()
            enabled.trace_add("write", _upd_sel)
            var.trace_add("write", _upd_sel)
            return fr

        if ftype == "tags":
            return self._build_tags_field(parent, key, idx, field_key, val, on_change)

        # fallback
        lbl = ttk.Label(parent, text=str(val))
        return lbl

    def _build_tags_field(self, parent, key, idx, field_key, val, on_change):
        item = self.data[key]["items"][idx]
        arr = val if isinstance(val, list) else []

        fr = ttk.Frame(parent)
        tags_frame = ttk.Frame(fr)
        tags_frame.pack(fill="x")

        def _refresh_tags():
            for w in tags_frame.winfo_children():
                w.destroy()
            for i, v in enumerate(arr):
                tag_fr = ttk.Frame(tags_frame)
                tag_fr.pack(side="left", padx=2, pady=2)
                display = _render_preview(v) if "<ico:" in str(v) else str(v)
                ttk.Label(tag_fr, text=display, font=("Segoe UI", 9), background="#533483",
                          foreground="#fff", padding=[4, 1]).pack(side="left")
                ttk.Button(tag_fr, text="x", style="Del.TButton", width=2,
                           command=lambda i=i: _remove(i)).pack(side="left")

        def _remove(i):
            arr.pop(i)
            set_val(item, field_key, arr)
            on_change()
            _refresh_tags()

        def _add(event=None):
            v = entry_var.get().strip()
            if v:
                arr.append(v)
                set_val(item, field_key, arr)
                on_change()
                entry_var.set("")
                _refresh_tags()

        entry_var = tk.StringVar()
        add_fr = ttk.Frame(fr)
        add_fr.pack(fill="x", pady=(2, 0))
        e = ttk.Entry(add_fr, textvariable=entry_var, width=15)
        e.pack(side="left")
        e.bind("<Return>", _add)
        ttk.Button(add_fr, text="+", command=_add, width=3).pack(side="left", padx=4)

        # Icon shortcuts for sequence fields
        if "sequence" in field_key:
            ico_fr = ttk.Frame(fr)
            ico_fr.pack(fill="x", pady=(2, 0))
            for tag, lbl, emoji in ICONS:
                balise = f"<ico:{tag}>"
                ttk.Button(ico_fr, text=f"{emoji} {lbl}", style="Icon.TButton",
                           command=lambda b=balise: (arr.append(b), set_val(item, field_key, arr),
                                                     on_change(), _refresh_tags())).pack(side="left", padx=1)

        _refresh_tags()
        return fr

    # ── Add / Delete items ────────────────────────────────
    def _add_item(self, key):
        tab = next(t for t in TABS if t["key"] == key)
        new_item = json.loads(json.dumps(tab["defaults"]))
        self.data[key]["items"].append(new_item)
        self.dirty.add(key)
        self._refresh_list(key)
        # Select new item
        tree = self.tree_widgets[key]
        iid = str(len(self.data[key]["items"]) - 1)
        tree.selection_set(iid)
        tree.see(iid)

    def _delete_item(self, key, idx):
        tab = next(t for t in TABS if t["key"] == key)
        item = self.data[key]["items"][idx]
        name = item.get("nom") or item.get("id") or f"#{idx}"
        if not messagebox.askyesno("Supprimer", f"Supprimer « {name} » ?"):
            return
        self.data[key]["items"].pop(idx)
        self.dirty.add(key)
        self._clear_detail(key)
        self._refresh_list(key)

    # ── Saving ────────────────────────────────────────────
    def _save_one(self, key):
        tab = next(t for t in TABS if t["key"] == key)
        path = self._resolve_path(tab)
        out = {}
        meta = self.data[key].get("meta")
        if meta:
            out["meta"] = meta
        out[tab["data_key"]] = self.data[key]["items"]

        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)

        # Sync boss lore to the associated Docs/<lore_md> (section ## Lore)
        md_synced = 0
        if key == "boss":
            for item in self.data[key]["items"]:
                md_name = (item.get("lore_md") or "").strip()
                lore_txt = item.get("lore") or ""
                if not md_name:
                    continue
                if self._sync_lore_to_md(md_name, lore_txt):
                    md_synced += 1

        self.dirty.discard(key)
        n = len(self.data[key]["items"])
        msg = f"Sauvegarde OK — {n} cartes"
        if key == "boss" and md_synced:
            msg += f" (+ {md_synced} MD synchronises)"
        self.data[key]["info_label"].configure(text=msg)
        self.after(3000, lambda: self.data[key]["info_label"].configure(
            text=f"{tab['file']} — {n} cartes"))

    def _sync_lore_to_md(self, md_name, lore_text):
        """Write lore_text into the ## Lore section of DOCS_DIR/<md_name>.
        Creates the section after ## Identité if missing, or replaces it if present.
        Returns True on success, False if the md file does not exist.
        """
        md_path = DOCS_DIR / md_name
        if not md_path.exists():
            return False
        try:
            content = md_path.read_text(encoding="utf-8")
        except Exception:
            return False
        import re as _re
        section = f"## Lore\n\n{lore_text.strip()}\n"
        pat_existing = _re.compile(r"## Lore\s*\n.*?(?=\n## |\Z)", _re.DOTALL)
        if pat_existing.search(content):
            new_content = pat_existing.sub(section.rstrip() + "\n", content)
        else:
            pat_after_id = _re.compile(r"(## Identité\s*\n.*?)(\n## )", _re.DOTALL)
            m = pat_after_id.search(content)
            if m:
                new_content = content[:m.end(1)] + "\n" + section + m.group(2) + content[m.end():]
            else:
                new_content = content.rstrip() + "\n\n" + section
        if new_content != content:
            md_path.write_text(new_content, encoding="utf-8")
        return True

    def _save_all(self):
        for tab in TABS:
            self._save_one(tab["key"])
        messagebox.showinfo("Sauvegarde", "Tous les fichiers ont ete sauvegardes.")

    # ── Close guard ───────────────────────────────────────
    def destroy(self):
        if self.dirty:
            names = ", ".join(self.dirty)
            if messagebox.askyesno("Modifications non sauvegardees",
                                   f"Des modifications non sauvegardees dans : {names}\n\nSauvegarder avant de quitter ?"):
                self._save_all()
        super().destroy()


if __name__ == "__main__":
    app = CardEditorApp()
    app.mainloop()
