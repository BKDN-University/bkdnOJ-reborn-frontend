import React from 'react';
import { connect } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { Form, Row, Col, Button } from 'react-bootstrap';

import judgeAPI from 'api/judge';
import { SpinLoader } from 'components';
import { withParams } from 'helpers/react-router'
import { setTitle } from 'helpers/setTitle';

import './Details.scss';

class AdminJudgeDetails extends React.Component {
  constructor(props) {
    super(props);
    const { id } = this.props.params;
    this.id = id;
    this.state = {
      loaded: false, errors: null,
      data: undefined,
    };
  }

  componentDidMount() {
    setTitle(`Admin | Judge#${this.id}`)
    judgeAPI.getJudgeDetails({id: this.id})
      .then((res) => {
        this.setState({
          data: res.data,
          loaded: true,
        })
        setTitle(`Admin | Judge. ${res.data.name}`)
      }).catch((err) => {
        this.setState({
          loaded: true,
          errors: err,
        })
      })
  }

  getStartTime() {
    if (this.state.data && this.state.data.start_time) {
      let time = new Date(this.state.data.start_time)
      time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
      return time.toISOString().slice(0, 16);
    }
    return null;
  }
  setStartTime(v) {
    let time = new Date(v)
    const data = this.state.data;
    this.setState({ data : { ...data, start_time: time.toISOString() } });
  }

  inputChangeHandler(event, params={isCheckbox: null}) {
    const isCheckbox = params.isCheckbox || false;

    let newData = this.state.data;
    if (!isCheckbox) newData[event.target.id] = event.target.value
    else {
      newData[event.target.id] = !newData[event.target.id]
    }
    this.setState({ data : newData })
  }

  render() {
    if (this.state.redirectUrl) 
      return ( <Navigate to={`${this.state.redirectUrl}`} /> )
    
    const {loaded, errors, data} = this.state;

    return (
      <div className="admin judge-panel">
        <h4 className="judge-title">
          { !loaded && <span><SpinLoader/> Loading...</span>}
          { loaded && !!errors && <span>Something went wrong.</span>}
          { loaded && !errors && `Viewing Judge. ${data.name}` }
        </h4>
        <hr/>
        <div className="judge-details">
          { !loaded && <span><SpinLoader/> Loading...</span> }

          { loaded && !errors && <>
            <Form id="judge-general" onSubmit={(e) => this.formSubmitHandler(e)}>
              <Row>
                <Form.Label column="sm" xs={2} > ID </Form.Label>
                <Col> <Form.Control size="sm" type="text" placeholder="Judge id" id="id"
                        value={data.id} disabled readOnly
                /></Col>
              </Row>
              <Row>
                <Form.Label column="sm" lg={2}> Name </Form.Label>
                <Col> <Form.Control size="sm" type="text" placeholder="Judge Name" id="name"
                        value={data.name} onChange={(e)=>this.inputChangeHandler(e)}
                /></Col>
                <Form.Label column="sm" lg={2}> Auth Key </Form.Label>
                <Col> <Form.Control size="sm" type="text" placeholder="Judge Authentication key" id="auth_key"
                        value={data.auth_key} onChange={(e)=>this.inputChangeHandler(e)}
                /></Col>
                <Form.Label column="sm" xl={12}> Description </Form.Label>
                <Col xs={12}> <Form.Control size="sm" type="textarea" placeholder="Description" id="description"
                        value={data.description} onChange={(e)=>this.inputChangeHandler(e)}
                /></Col>
              </Row>

              <Row>
                <Form.Label column="sm" > Online </Form.Label>
                <Col > <Form.Control size="sm" type="checkbox" id="online"
                        checked={data.online}
                        onChange={(e)=>this.inputChangeHandler(e, {isCheckbox: true})}
                /></Col>
                <Form.Label column="sm" > Is Blocked? </Form.Label>
                <Col > <Form.Control size="sm" type="checkbox" id="is_blocked"
                        checked={data.is_blocked}
                        onChange={(e)=>this.inputChangeHandler(e, {isCheckbox: true})}
                /></Col>
              </Row>
              <Row>
                <Form.Label column="sm" md={2}> Start Time </Form.Label>
                <Col> <Form.Control size="sm" type="datetime-local" id="start_time"
                        value={this.getStartTime()} onChange={(e)=>this.setStartTime(e.target.value)}
                /></Col>
                <Form.Label column="sm" md={2}> Last IP </Form.Label>
                <Col> <Form.Control size="sm" type="text" id="last_ip"
                        value={data.last_ip} onChange={(e)=>this.inputChangeHandler(e)}
                /></Col>
              </Row>

              <Row>
                <Form.Label column="sm" md={2}> Ping </Form.Label>
                <Col > <Form.Control size="sm" type="text" id="ping"
                        value={data.ping} onChange={(e)=>this.inputChangeHandler(e)}
                /></Col>
                <Form.Label column="sm" md={2}> Load </Form.Label>
                <Col> <Form.Control size="sm" type="text" id="load"
                        value={data.load} onChange={(e)=>this.inputChangeHandler(e)}
                /></Col>
              </Row>

              <Row>
                <Form.Label column="sm" > Problems </Form.Label>
                <Col xl={12}> <Form.Control size="sm" type="text" id="problems"
                        value={JSON.stringify(data.problems)} readOnly disabled
                /></Col>
              </Row>
              <Row>
                <Form.Label column="sm" > Runtimes </Form.Label>
                <Col xl={12}> <Form.Control size="sm" type="text" id="runtimes"
                        value={JSON.stringify(data.runtimes)} readOnly disabled
                /></Col>
              </Row>

              <hr className="m-2" />

              <Row>
                <Col lg={10}>
                  <sub>**Các thiết lập khác sẽ được thêm sau.</sub>
                </Col>
                <Col >
                  <Button variant="dark" size="sm" type="submit" className="mb-1">
                    Save
                  </Button>
                </Col>
              </Row>
            </Form>
          </>
          }
        </div>
      </div>
    )
  }
}

let wrappedPD = AdminJudgeDetails;
wrappedPD = withParams(wrappedPD);
const mapStateToProps = state => {
    return { user : state.user.user }
}
wrappedPD = connect(mapStateToProps, null)(wrappedPD);
export default wrappedPD;