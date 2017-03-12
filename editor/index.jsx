import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { buildSchema } from 'graphql/utilities';

import fakeIDL from 'raw-loader!../fake_definition.graphql';
import GraphQLEditor from './editor/GraphQLEditor';
import GraphiQL from 'graphiql';

import fetch from 'isomorphic-fetch';

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
      status: null
    }
  }

  componentDidMount() {
    fetch('/user-idl')
      .then(response => response.text())
      .then(text => {
        this.updateValue(text);
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

  updateValue(userIDL) {
    this.setState({
      value: userIDL,
      cachedValue: userIDL
    });
  }

  postIDL(idl) {
    return fetch('/user-idl', {
      method: 'post',
      headers: { 'Content-Type': 'text/plain' },
      body: idl
    })
  }

  validateIdl(idl) {
    let fullIdl = idl + '\n' + fakeIDL;
    try {
      buildSchema(fullIdl);
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

    if (!this.validateIdl(value)) return;

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
    this.setState(prevState => ({...prevState, value: val, dirty: val !== this.state.cachedValue}))
  }

  render() {
    let { value, activeTab, dirty } = this.state;

    return (
      <div className="faker-editor-container">
        <nav>
          <ul>
            <li onClick={() => this.switchTab(0)} className={classNames({
              '-active': activeTab === 0,
              '-dirty': dirty
            })}> Editor </li>
            <li onClick={() => this.switchTab(1)} className={classNames({
              '-active': activeTab === 1
            })}> GraphiQL </li>
          </ul>
        </nav>
        <div className="tabs-container">
          <div className={classNames('tab-content', 'editor-container', {
            '-active': activeTab === 0
          })}>
            <GraphQLEditor schemaPrefix={fakeIDL} mode="idl" onEdit={this.onEdit} value={value}/>
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
            <GraphiQL fetcher={this.fetcher} />
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<FakeEditor />, document.getElementById('container'));
