import ReactDOM from 'react-dom'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import toMarkdown from 'to-markdown'
import showdown from 'showdown'

import Editor from 'react-medium-editor'
import MediumButton from 'medium-button'

import 'medium-editor/dist/css/medium-editor.css'
import 'medium-editor/dist/css/themes/default.css'

import {
  showWidgetFullPage,
  hideWidgetFullPage,
} from '../../state/actions'

const unwrap = html => {
  let s = html.substr(html.indexOf('>') + 1)
  return s.substr(0, s.lastIndexOf('<')).trim()
}

class MediumEditor extends PureComponent {

  componentWillReceiveProps(nextProps) {
    if (this.props.choosedDocument !== nextProps.choosedDocument && nextProps.choosedDocument) {
      this.props.input.onChange(this.props.input.value.replace(/___DOC___/g, nextProps.choosedDocument.id))
      this.props.hideWidgetFullPage()
    }
  }

  showDocumentChooser = () => {
    this.props.showWidgetFullPage('documentChooser', undefined, this.props.input.name)
  }

  componentWillUnmount() {
    this.props.hideWidgetFullPage()
  }

  documentPicker = new MediumButton({
    label: 'Document Picker',
    action: (html, mark, parent) => {
      this.showDocumentChooser()
      ReactDOM.findDOMNode(this.editor).click()
      return '<object id="___DOC___">(___DOC___)' + html + '</object>'
      // console.log(html, mark, parent)
      // return html

      // console.log(this.editor)
      // return '<object>' + html + '</object>'
      // return html
      // if (parent.tagName.toLowerCase() === 'object') {
      //   // return unwrap(html)
      // } else {
      //   // return '<object id="[___DOC___]">' + html + '</object>'
      //   return '<object id="___DOC___">' + html + '</object>'
      // }
    }
  })

  render() {
    const { input: { value, onChange }, style, className } = this.props
    const converter = new showdown.Converter()
    return (
      <Editor
        ref={r => this.editor = r}
        style={{ outline: 'none', ...style }}
        className={className}
        text={converter.makeHtml(value)}
        onChange={(text, medium) => onChange(toMarkdown(text))}
        options={{
          extensions: { doc: this.documentPicker },
          toolbar: {
            buttons: ['bold', 'italic', 'h2', 'h1', 'anchor', 'doc']
          }
        }}
      />
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  let choosedDocument = null
  if (state.ui.fullPageWidgets.namespace === ownProps.input.name) {
      choosedDocument = state.widgets.chooseDocuments.choosedDocument
  }
  return {
    choosedDocument,
  }
}

export default connect(mapStateToProps, {
  showWidgetFullPage,
  hideWidgetFullPage,
})(MediumEditor)