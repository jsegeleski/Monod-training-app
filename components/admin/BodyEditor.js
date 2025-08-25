// components/admin/BodyEditor.js
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Load Quill only on the client
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'blockquote', 'code-block'],
  ['clean'],
];

const FORMATS = [
  'header', 'bold', 'italic', 'underline',
  'list', 'bullet', 'link', 'blockquote', 'code-block'
];

export default function BodyEditor({ value, onChange, placeholder }) {
  return (
    <div className="quill-wrap">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder || 'Write the slide body…'}
        modules={{ toolbar: TOOLBAR }}
        formats={FORMATS}
      />
    </div>
  );
}