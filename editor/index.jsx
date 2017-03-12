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

const fakeSchema = buildSchema(fakeIDL + ' schema { query: QueryType } type QueryType { a: String }');

class FakeEditor extends React.Component {
  constructor() {
    super();

    this.state = {
      value: null,
      cachedValue: null,
      activeTab: 0,
      dirty: false
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

  saveUserIDL = () => {
    let { value } = this.state;
    this.postIDL(value).then(res => {
      if (res.ok) {
        return this.setState(prevState => ({...prevState, cachedValue: value, dirty: false, error: null}));
      } else {
        res.text().then(errorMessage => {
          return this.setState(prevState => ({...prevState, error: errorMessage}));
        });
      }
    })
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
            <GraphQLEditor schema={fakeSchema} onEdit={this.onEdit} value={value}/>
            <div className="action-panel">
              <a className="material-button" onClick={this.saveUserIDL}
                 disabled={!dirty}>
                 <span> Save </span>
              </a>
              <div className="error-message"> {this.state.error} </div>
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
