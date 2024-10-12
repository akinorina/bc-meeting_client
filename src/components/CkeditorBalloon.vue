<script setup lang="ts">
import {
  BalloonEditor,
  AccessibilityHelp,
  Alignment,
  Autoformat,
  AutoImage,
  AutoLink,
  Autosave,
  BalloonToolbar,
  BlockQuote,
  Bold,
  CloudServices,
  Code,
  Essentials,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  GeneralHtmlSupport,
  Highlight,
  ImageBlock,
  ImageInline,
  ImageInsert,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  Markdown,
  MediaEmbed,
  Paragraph,
  PasteFromMarkdownExperimental,
  PasteFromOffice,
  RemoveFormat,
  SelectAll,
  SimpleUploadAdapter,
  SpecialCharacters,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersEssentials,
  SpecialCharactersLatin,
  SpecialCharactersMathematical,
  SpecialCharactersText,
  Strikethrough,
  Style,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  TodoList,
  Underline,
  Undo
} from 'ckeditor5'
import translations from 'ckeditor5/translations/ja.js'
import 'ckeditor5/ckeditor5.css'
import { onMounted, ref } from 'vue'
import { axios } from '@/lib/Axios'

export interface Props {
  placeholder?: string
}
const { placeholder = '' } = defineProps<Props>()

const vmodel = defineModel({ type: String, default: '' })

const editor = BalloonEditor
const editorConfig: any = {
  toolbar: {
    items: [
      'undo',
      'redo',
      '|',
      'findAndReplace',
      '|',
      'style',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'subscript',
      'superscript',
      'code',
      'removeFormat',
      '|',
      'specialCharacters',
      'link',
      'insertImage',
      'mediaEmbed',
      'insertTable',
      'highlight',
      'blockQuote',
      '|',
      'alignment',
      '|',
      'bulletedList',
      'numberedList',
      'todoList',
      'outdent',
      'indent'
    ],
    shouldNotGroupWhenFull: false
  },
  plugins: [
    AccessibilityHelp,
    Alignment,
    Autoformat,
    AutoImage,
    AutoLink,
    Autosave,
    BalloonToolbar,
    BlockQuote,
    Bold,
    CloudServices,
    Code,
    Essentials,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    GeneralHtmlSupport,
    Highlight,
    ImageBlock,
    ImageInline,
    ImageInsert,
    ImageInsertViaUrl,
    ImageResize,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,
    ListProperties,
    Markdown,
    MediaEmbed,
    Paragraph,
    PasteFromMarkdownExperimental,
    PasteFromOffice,
    RemoveFormat,
    SelectAll,
    SimpleUploadAdapter,
    SpecialCharacters,
    SpecialCharactersArrows,
    SpecialCharactersCurrency,
    SpecialCharactersEssentials,
    SpecialCharactersLatin,
    SpecialCharactersMathematical,
    SpecialCharactersText,
    Strikethrough,
    Style,
    Subscript,
    Superscript,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextTransformation,
    TodoList,
    Underline,
    Undo
  ],
  balloonToolbar: [
    'bold',
    'italic',
    '|',
    'link',
    'insertImage',
    '|',
    'bulletedList',
    'numberedList'
  ],
  fontFamily: {
    supportAllValues: true
  },
  fontSize: {
    options: [10, 12, 14, 'default', 18, 20, 22],
    supportAllValues: true
  },
  htmlSupport: {
    allow: [
      {
        name: /^.*$/,
        styles: true,
        attributes: true,
        classes: true
      }
    ]
  },
  image: {
    toolbar: [
      'imageTextAlternative',
      '|',
      'imageStyle:inline',
      'imageStyle:wrapText',
      'imageStyle:breakText',
      '|',
      'resizeImage'
    ]
  },
  initialData: '',
  language: 'ja',
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: 'https://',
    decorators: {
      toggleDownloadable: {
        mode: 'manual',
        label: 'Downloadable',
        attributes: {
          download: 'file'
        }
      }
    }
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true
    }
  },
  placeholder: placeholder,
  style: {
    definitions: [
      {
        name: 'Article category',
        element: 'h3',
        classes: ['category']
      },
      {
        name: 'Title',
        element: 'h2',
        classes: ['document-title']
      },
      {
        name: 'Subtitle',
        element: 'h3',
        classes: ['document-subtitle']
      },
      {
        name: 'Info box',
        element: 'p',
        classes: ['info-box']
      },
      {
        name: 'Side quote',
        element: 'blockquote',
        classes: ['side-quote']
      },
      {
        name: 'Marker',
        element: 'span',
        classes: ['marker']
      },
      {
        name: 'Spoiler',
        element: 'span',
        classes: ['spoiler']
      },
      {
        name: 'Code (dark)',
        element: 'pre',
        classes: ['fancy-code', 'fancy-code-dark']
      },
      {
        name: 'Code (bright)',
        element: 'pre',
        classes: ['fancy-code', 'fancy-code-bright']
      }
    ]
  },
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells',
      'tableProperties',
      'tableCellProperties'
    ]
  },
  translations: [translations],
  simpleUpload: {
    // The URL that the images are uploaded to.
    uploadUrl: '/api/images/upload',

    // Enable the XMLHttpRequest.withCredentials property.
    withCredentials: true,

    // Headers sent along with the XMLHttpRequest to the upload server.
    headers: {
      Authorization: axios.defaults.headers['Authorization']
    }
  }
}
const isLayoutReady = ref(false)

onMounted(() => {
  isLayoutReady.value = true
})
</script>

<template>
  <div>
    <div class="main-container">
      <div
        class="editor-container editor-container_balloon-editor editor-container_include-style"
        ref="editorContainerElement"
      >
        <div class="editor-container__editor">
          <div ref="editorElement">
            <ckeditor
              v-model="vmodel"
              :editor="editor"
              :config="editorConfig"
              v-if="isLayoutReady"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
