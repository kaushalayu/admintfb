import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

const ToolbarButton = ({ onClick, isActive, label, title }) => (
  <button
    type="button"
    onClick={onClick}
    className={isActive ? 'is-active' : ''}
    title={title}
  >
    {label}
  </button>
)

const RichEditor = ({ value, onChange, placeholder = 'Start writing...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) return null

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} label="B" title="Bold" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} label="I" title="Italic" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} label="U" title="Underline" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} label="S" title="Strikethrough" />
        <div className="divider" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} label="H2" title="Heading 2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} label="H3" title="Heading 3" />
        <div className="divider" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} label="• List" title="Bullet List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} label="1. List" title="Ordered List" />
        <div className="divider" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} label='" Quote' title="Blockquote" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} label="<> Code" title="Code Block" />
        <div className="divider" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} label="⬅" title="Align Left" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} label="⬌" title="Align Center" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} label="➡" title="Align Right" />
        <div className="divider" />
        <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} label="🔗 Link" title="Link" />
        <ToolbarButton onClick={addImage} label="🖼 Image" title="Insert Image" />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichEditor
