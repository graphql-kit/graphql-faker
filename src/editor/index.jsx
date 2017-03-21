import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { buildSchema, extendSchema, parse } from 'graphql';

import fakeIDL from 'raw-loader!../fake_definition.graphql';
import GraphQLEditor from './editor/GraphQLEditor';
import GraphiQL from 'graphiql';

import fetch from 'isomorphic-fetch'

import { EditIcon, ConsoleIcon, GithubIcon } from './icons';

import './css/app.css';
import './css/codemirror.css';
import './editor/editor.css';
import 'graphiql/graphiql.css';

// const fakeSchema = buildSchema(fakeIDL + ' schema { query: QueryType } type QueryType { a: String }');

class FakeEditor extends React.Component {
  constructor() {
    super();

    this.state = {
      value: null,
      cachedValue: null,
      activeTab: 0,
      dirty: false,
      error: null,
      status: null,
      schema: undefined
    }
  }

  componentDidMount() {
    fetch('/user-idl')
      .then(response => response.json())
      .then(idls => {
        this.updateValue(idls);
      });

    window.onbeforeunload = () => {
      if (this.state.dirty) return 'You have unsaved changes. Exit?'
    };
  }

  fetcher(graphQLParams) {
    return fetch(window.location.origin + '/graphql', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQLParams),
    }).then(response => response.json());
  }

  updateValue({schemaIDL, extensionIDL}) {
    let value = extensionIDL || schemaIDL;
    this.proxiedSchemaIDL = extensionIDL ? schemaIDL : null;
    this.setState({
      value,
      cachedValue: value,
      extendMode: !!extensionIDL
    });
  }

  postIDL(idl) {
    return fetch('/user-idl', {
      method: 'post',
      headers: { 'Content-Type': 'text/plain' },
      body: idl
    })
  }

  updateIdl(value) {
    let extensionIDL;
    let schemaIDL;
    if (this.state.extendMode) {
      extensionIDL = value;
      schemaIDL = this.proxiedSchemaIDL;
    } else {
      schemaIDL = value;
    }
    let fullIdl = schemaIDL + '\n' + fakeIDL;
    try {
      let schema = buildSchema(fullIdl);
      if (extensionIDL)
        schema = extendSchema(schema, parse(extensionIDL));
      this.setState(prevState => ({...prevState, schema: schema, error: null}));
      return true;
    } catch(e) {
      this.setState(prevState => ({...prevState, error: e.message}));
      return false;
    }
  }

  setStatus(status, delay) {
    this.setState(prevState => ({...prevState, status: status}));
    if (!delay) return;
    setTimeout(() => {
      this.setState(prevState => ({...prevState, status: null}));
    }, delay);
  }

  saveUserIDL = () => {
    let { value, dirty } = this.state;
    if (!dirty) return;

    if (!this.updateIdl(value)) return;

    this.postIDL(value).then(res => {
      if (res.ok) {
        this.setStatus('Saved!', 2000);
        return this.setState(prevState => ({...prevState, cachedValue: value, dirty: false, error: null}));
      } else {
        res.text().then(errorMessage => {
          return this.setState(prevState => ({...prevState, error: errorMessage}));
        });
      }
    });
  }

  switchTab(tab) {
    this.setState(prevState => ({...prevState, activeTab: tab}));
  }

  onEdit = (val) => {
    this.updateIdl(val);
    this.setState(prevState => ({
      ...prevState,
      value: val,
      dirty: val !== this.state.cachedValue
    }))
  }

  render() {
    let { value, activeTab, dirty, extendMode } = this.state;
    let prefixIDL = fakeIDL + (this.proxiedSchemaIDL || '');
    return (
      <div className="faker-editor-container">
        <nav>
          <div className="logo">
            <a href="https://github.com/APIs-guru/graphql-faker" target="_blank"> <img src="./logo.svg"/> </a>
          </div>
          <ul>
            <li onClick={() => this.switchTab(0)} className={classNames({
              '-active': activeTab === 0,
              '-dirty': dirty
            })}> <EditIcon/> </li>
            <li onClick={() => this.switchTab(1)} className={classNames({
              '-active': activeTab === 1
            })}> <ConsoleIcon/> </li>
            <li className="-pulldown -link">
              <a href="https://github.com/APIs-guru/graphql-faker" target="_blank"> <GithubIcon /> </a>
            </li>
          </ul>
        </nav>
        <div className="tabs-container">
          <div className={classNames('tab-content', 'editor-container', {
            '-active': activeTab === 0
          })}>
            <GraphQLEditor
              schemaPrefix={prefixIDL}
              mode="idl"
              extendMode={!!extendMode}
              onEdit={this.onEdit}
              onCommand={this.saveUserIDL}
              value={value}
            />
            <div className="action-panel">
              <a className="material-button" onClick={this.saveUserIDL}
                 disabled={!dirty}>
                 <span> Save </span>
              </a>
              <div className="status-bar">
                <span className="status"> {this.state.status} </span>
                <span className="error-message">{this.state.error}</span>
              </div>
            </div>
          </div>
          <div className={classNames('tab-content', {
            '-active': activeTab === 1
          })}>
            <GraphiQL fetcher={this.fetcher} schema={this.state.schema}/>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<FakeEditor />, document.getElementById('container'));
