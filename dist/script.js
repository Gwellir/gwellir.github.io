"use strict";
var VotingStage;
(function (VotingStage) {
    VotingStage[VotingStage["SELECT_TO_VOTING"] = 0] = "SELECT_TO_VOTING";
})(VotingStage || (VotingStage = {}));
var Renderer = /** @class */ (function () {
    function Renderer() {
    }
    Renderer.renderCandidateView = function (candidate, options) {
        var id = "candidate".concat(candidate.index);
        var selectionInputHTML = options.inGroup ?
            "type=\"radio\" name=\"group".concat(candidate.group, "\" value=\"candidate").concat(candidate.index, "\"") :
            "type=\"checkbox\" name=\"candidate".concat(candidate.index, "\" value=\"1\"");
        return "<label for=\"".concat(id, "\" class=\"candidate\">\n<input ").concat(selectionInputHTML, " class=\"js-voting-item\" id=\"").concat(id, "\" data-id=\"").concat(candidate.index, "\" ").concat(options.readonly ? 'readonly' : '', " ").concat(candidate.selected ? 'checked' : '', "/>\n<div class=\"candidate-card\">\n<div class=\"candidate-card__img\"><img src=\"").concat(candidate.img, "\" alt=\"").concat(candidate.name, "\"></div>            \n            <div class=\"candidate-card__data\">\n                <span class=\"candidate-card__name\">").concat(candidate.name, "</span>\n                <span class=\"candidate-card__src\">").concat(candidate.source, "</span>            \n            </div>            \n        </div>\n        </label>");
    };
    Renderer.renderCandidateList = function (candidates, options) {
        return "\n<h1>Voting</h1>\n      <h4>Candidates</h4>\n      <!-- \u0421\u043F\u0438\u0441\u043E\u043A \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432, \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 img, name, source, \u043F\u043E\u0441\u043B\u0435 \u0441\u0438\u0434\u0438\u043D\u0433\u0430, \u0432\u0435\u0440\u043E\u044F\u0442\u043D\u043E, seed number -->\n      <form class=\"candidates\">".concat(candidates.map(function (item) {
            return Renderer.renderCandidateView(item, {
                inGroup: options.byGroups,
                readonly: options.readonly
            });
        }).join(""), "</form>\n      <!--<button id=\"vote\">Vote</button>\n      <button id=\"reset\">Reset</button>-->\n");
    };
    return Renderer;
}());
var Voting = /** @class */ (function () {
    function Voting(el) {
        this.el = el;
        this.readyCallback = null;
    }
    Voting.prototype.onReady = function (callback) {
        this.readyCallback = callback;
    };
    Voting.prototype.init = function () {
        var _this = this;
        this.fetchData()
            .then(function (response) {
            _this.el.innerHTML = Renderer.renderCandidateList(_this.populateCandidates(response.candidates), {
                readonly: false,
                byGroups: response.stage !== VotingStage.SELECT_TO_VOTING
            });
            /*let voteEl: HTMLElement = document.getElementById("vote") as HTMLElement;
            voteEl && voteEl.addEventListener("click", this.vote.bind(this))

            let resetEl: HTMLElement = document.getElementById("reset") as HTMLElement;
            resetEl && resetEl.addEventListener("click", this.reset.bind(this))*/
            _this.readyCallback && _this.readyCallback();
        });
    };
    Voting.prototype.fetchData = function () {
        return fetch('data.json')
            .then(function (response) {
            return response.json();
        });
    };
    Voting.prototype.populateCandidates = function (candidates) {
        var urlParams = new URLSearchParams(window.location.search);
        console.log(urlParams.get('votes'));
        var votes = urlParams.get('votes') || "";
        return candidates.map(function (item, index) {
            item.index = index;
            item.selected = votes[index] === "1";
            return item;
        });
        return candidates;
    };
    Voting.prototype.getSelected = function () {
        var len = document.querySelectorAll(".js-voting-item").length, res = "";
        for (var i = 0; i < len; i++) {
            var candidate = document.querySelector(".js-voting-item[data-id='".concat(i, "']"));
            res += candidate && candidate.checked ? "1" : "0";
        }
        return res;
    };
    return Voting;
}());
