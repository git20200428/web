let LoadingModal = function () {
    let _backdrop = document.createElement("div");
    _backdrop.className = "loading-modal-backdrop";
    this.backdrop = _backdrop;
    let _modal = document.createElement("div");
    _modal.className = "loading-modal";
    this.modal = _modal;
    let _modalContainer = document.createElement("div");
    _modalContainer.className = "loading-modal-container";
    let _spinner = document.createElement("div");
    _spinner.className = "spinner";
    let _container1 = document.createElement("div");
    _container1.className = "spinner-container container1";
    let _container2 = document.createElement("div");
    _container2.className = "spinner-container container2";
    for (let i = 1; i <= 4; i++) {
        let _div1 = document.createElement("div");
        _div1.className = "circle" + i;
        _container1.append(_div1);
        let _div2 = document.createElement("div");
        _div2.className = "circle" + i;
        _container2.append(_div2);
    }
    _spinner.append(_container1);
    _spinner.append(_container2);
    _modalContainer.append(_spinner);
    this.modal.append(_modalContainer);
};

LoadingModal.prototype = {
    constructor: LoadingModal,
    show: function () {
        document.body.append(this.modal);
        document.body.append(this.backdrop);
    },
    close: function () {
        this.modal.remove();
        this.backdrop.remove();
    }
};

export default LoadingModal;