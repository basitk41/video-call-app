import React from "react";
const Modal = ({ name, acceptCall }) => {
  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        data-toggle="modal"
        data-target="#exampleModal"
        hidden
        id="calling"
      ></button>
      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Incoming Call
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">{name} is calling you</div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
                id="rejectCall"
              >
                Reject
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={acceptCall}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
