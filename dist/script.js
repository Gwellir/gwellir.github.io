"use strict";
var VotingStage;
(function (VotingStage) {
    VotingStage[VotingStage["SELECT_TO_VOTING"] = 0] = "SELECT_TO_VOTING";
    VotingStage[VotingStage["VOTING"] = 1] = "VOTING";
    VotingStage[VotingStage["WINNER"] = 2] = "WINNER";
})(VotingStage || (VotingStage = {}));
var VotingLocalization = {
    0: "Candidates",
    1: "Vote #{stage}",
    2: "Winner"
};
var Renderer = /** @class */ (function () {
    function Renderer() {
    }
    Renderer.renderCandidateView = function (candidate, options) {
        var id = "candidate".concat(candidate.index);
        var selectionInputHTML = options.groupName !== null ?
            "type=\"radio\" name=\"group".concat(options.groupName, "\" value=\"candidate").concat(candidate.index, "\"") :
            "type=\"checkbox\" name=\"candidate".concat(candidate.index, "\" value=\"1\"");
        return "<label for=\"".concat(id, "\" class=\"candidate\">\n<input ").concat(selectionInputHTML, " class=\"js-voting-item\" id=\"").concat(id, "\" data-id=\"").concat(candidate.index, "\" ").concat(options.readonly ? 'disabled' : '', " ").concat(candidate.selected ? 'checked' : '', "/>\n<div class=\"candidate-card\">\n<div class=\"candidate-card__img\"><img src=\"").concat(candidate.img, "\" alt=\"").concat(candidate.name, "\"></div>            \n            <div class=\"candidate-card__data\">\n                <span class=\"candidate-card__name\">").concat(candidate.name, "</span>\n                <span class=\"candidate-card__src\">").concat(candidate.source, "</span>            \n            </div>            \n        </div>\n        </label>");
    };
    Renderer.renderCandidateList = function (candidates, options) {
        return "\n      <!-- \u0421\u043F\u0438\u0441\u043E\u043A \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432, \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 img, name, source, \u043F\u043E\u0441\u043B\u0435 \u0441\u0438\u0434\u0438\u043D\u0433\u0430, \u0432\u0435\u0440\u043E\u044F\u0442\u043D\u043E, seed number -->\n      <form class=\"candidates\">".concat(candidates.map(function (item) {
            return Renderer.renderCandidateView(item, {
                groupName: null,
                readonly: options.readonly
            });
        }).join(""), "</form>\n");
    };
    Renderer.renderCandidateListByGroups = function (groups, options) {
        var listHTML = "";
        groups.forEach(function (candidates, key) {
            listHTML += "<div class=\"candidate-group\">".concat(candidates.map(function (item) {
                return Renderer.renderCandidateView(item, {
                    groupName: key,
                    readonly: options.readonly
                });
            }).join(""), "</div>");
        });
        return "<form class=\"candidates\">".concat(listHTML, "</form>");
    };
    return Renderer;
}());
var Voting = /** @class */ (function () {
    function Voting(el) {
        this.el = el;
        this.readyCallback = null;
        this.stage = 0;
    }
    Voting.prototype.onReady = function (callback) {
        this.readyCallback = callback;
    };
    Voting.prototype.init = function () {
        var _this = this;
        this.fetchData()
            .then(function (response) {
            _this.stage = _this.getCurrentStage();
            var step = VotingStage.SELECT_TO_VOTING;
            var formattedCandidates = _this.populateCandidates(response.candidates);
            var groups;
            if (formattedCandidates.length !== response.candidates.length) {
                if (formattedCandidates.length > 1 && formattedCandidates.length % 2 === 0)
                    step = VotingStage.VOTING;
                else
                    step = VotingStage.WINNER;
            }
            var title = "<h1>Voting: <smaller>".concat(VotingLocalization[step].replace("{stage}", _this.stage), "</smaller></h1>");
            var html = "";
            switch (step) {
                case VotingStage.SELECT_TO_VOTING: {
                    html = Renderer.renderCandidateList(formattedCandidates, {
                        readonly: false
                    });
                    break;
                }
                case VotingStage.WINNER: {
                    formattedCandidates.forEach(function (candidate) {
                        candidate.selected = true;
                    });
                    html = Renderer.renderCandidateList(formattedCandidates, {
                        readonly: true
                    });
                    break;
                }
                default: {
                    groups = _this.getCandidatesByGroups(formattedCandidates);
                    html = Renderer.renderCandidateListByGroups(groups, {
                        readonly: false
                    });
                    break;
                }
            }
            _this.el.innerHTML = title + html;
            _this.readyCallback && _this.readyCallback();
        });
    };
    Voting.prototype.fetchData = function () {
        return fetch('data.json')
            .then(function (response) {
            return response.json();
        });
    };
    Voting.prototype.getCandidatesByGroups = function (candidates) {
        var groups = new Map();
        candidates.forEach(function (candidate) {
            var key = candidate.group;
            var oldArr = groups.get(key) || [];
            oldArr.push(candidate);
            groups.set(key, oldArr);
        });
        return groups;
    };
    Voting.prototype.populateCandidates = function (candidates) {
        var votes = this.getVotedIdx();
        var available = this.getAvailableIdx();
        if (available !== null) {
            candidates = available.map(function (idx, index) {
                candidates[idx].group = String(index >> 1);
                return candidates[idx];
            });
        }
        return candidates.map(function (item, index) {
            item.index = index;
            item.selected = votes.some(function (idx) { return idx === index; });
            return item;
        });
    };
    Voting.prototype.getCurrentStage = function () {
        var urlParams = new URLSearchParams(window.location.search);
        return Number(urlParams.get('stage') || "0");
    };
    Voting.prototype.getVotedIdx = function () {
        var urlParams = new URLSearchParams(window.location.search);
        var votes = urlParams.get('votes') || "";
        return votes.split("")
            .map(function (item, index) { return item === "1" ? index : -1; })
            .filter(function (item) { return item >= 0; });
    };
    Voting.prototype.getAvailableIdx = function () {
        var urlParams = new URLSearchParams(window.location.search);
        var available = urlParams.get('available');
        if (available === null) {
            return null;
        }
        var len = available.length;
        var res = [];
        for (var i = 0; i < len; i += 2) {
            res.push(Number(available[i] + available[i + 1]));
        }
        return res;
    };
    Voting.prototype.getSelected = function () {
        var len = document.querySelectorAll(".js-voting-item").length, res = "";
        for (var i = 0; i < len; i++) {
            var candidate = document.querySelector(".js-voting-item[data-id='".concat(i, "']"));
            res += candidate && candidate.checked ? "1" : "0";
        }
        return {
            stage: this.stage,
            votes: res
        };
    };
    return Voting;
}());
