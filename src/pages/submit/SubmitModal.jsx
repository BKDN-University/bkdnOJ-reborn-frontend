import React from 'react';
import { Modal, Button } from 'react-bootstrap';

import { BsExclamationCircle, BsFillLightningChargeFill } from 'react-icons/bs';
import { FaPaperPlane } from 'react-icons/fa';
import SubmitForm from './SubmitForm';
import './SubmitModal.scss'

export default class SubmitModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
    }
  }

  render() {
    return (
      <Modal show={this.props.show} 
          onHide={() => this.props.onHide()}
          className="submit-modal"
          backdrop="static"
          keyboard={false}
        >
        <Modal.Header >
          <Modal.Title>
            {"Instant Submit "}
            <BsFillLightningChargeFill size={20}/>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <SubmitForm prob={this.props.prob} lang={this.props.lang} submitting={this.state.submitting}/>
        </Modal.Body>

        <Modal.Footer>
          <div className="note">
          {
            !this.state.submitting 
            ? <>
              <div style={{height: "100%", width: "auto", margin: "auto", 
                display: "flex", verticalAlign: "center"}}>
                <BsExclamationCircle />
              </div>
              <span>This editor only store your most recent code. 
                Using multiple editors can cause conflict.</span>
            </>
            : <div className="note loading_3dot">Submitting</div>
          }
          </div>

          <Button variant="secondary" 
            onClick={() => this.props.onHide()}>Close</Button>
          
          <Button variant="dark"
            onClick={() => this.setState({submitting: true})}
            disabled={this.state.submitting}
          >
            {"Submit "}<FaPaperPlane size={12}/>
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}