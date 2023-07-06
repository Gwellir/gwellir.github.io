interface CandidateData {
    index: number,
    // mal_cid: number,
    name: string,
    group: string,
    source: string,
    img: string,
    selected: boolean
}

interface VotingSrcData {
    candidates: CandidateData[],
    voting_id: number,
    stage: number
}

enum VotingStage {
    SELECT_TO_VOTING = 0,
    VOTING = 1,
    WINNER = 2
}

let VotingLocalization: any = {
    0: "Candidates",
    1: "Vote #{stage}",
    2: "Winner"
}

class Renderer {
    static renderCandidateView(candidate: CandidateData, options: {
        readonly: boolean,
        groupName: string | null,
    }): string {
        return `<label class="candidate">
<input type="checkbox" name="candidate${candidate.index}" value="1" ${options.groupName ? ' data-group="' + options.groupName + '" ' : ''}
    class="js-voting-item" data-id="${candidate.index}" ${options.readonly ? 'disabled' : ''} ${candidate.selected ? 'checked' : ''}/>
<div class="candidate-card">
<div class="candidate-card__img"><img src="${candidate.img}" alt="${candidate.name}"></div>            
            <div class="candidate-card__data">
                <span class="candidate-card__name">${candidate.name}</span>
                <span class="candidate-card__src">${candidate.source}</span>            
            </div>            
        </div>
        </label>`
    }

    static renderWinnerView(candidate: CandidateData): string {
        return `<div class="candidate candidate--winner">
        <div class="candidate-card">
        <div class="candidate-card__img"><img src="${candidate.img}" alt="${candidate.name}"></div>            
            <div class="candidate-card__data">
                <span class="candidate-card__name">${candidate.name}</span>
                <span class="candidate-card__src">${candidate.source}</span>            
            </div>            
        </div>
        </div>`
    }

    static renderCandidateList(candidates: CandidateData[], options: {
        readonly: boolean
    }): string {
        return `
      <!-- Список кандидатов, отображение img, name, source, после сидинга, вероятно, seed number -->
      <form class="candidates">${candidates.map(item =>
            Renderer.renderCandidateView(item, {
                groupName: null,
                readonly: options.readonly
            })
        ).join("")}</form>
`
    }
    static renderWinnerList(candidates: CandidateData[]): string {
        return `<div class="candidates">${candidates.map(item =>Renderer.renderWinnerView(item)).join("")}</div>`
    }

    static renderCandidateListByGroups(groups: Map<string, CandidateData[]>, options: {
        readonly: boolean
    }): string {
        let listHTML: string = "";
        groups.forEach((candidates: CandidateData[], key: string) => {
            let hasSelected:boolean = candidates.some(item => item.selected);

            listHTML += `<div class="candidate-group">${candidates.map(item =>
                Renderer.renderCandidateView(item, {
                    groupName: key,
                    readonly: options.readonly || hasSelected
                })
            ).join("")}</div>`
        })
        return `<form class="candidates">${listHTML}</form>`
    }
}

class Voting {
    private readyCallback: Function | null = null;
    private closeCallback: Function | null = null;

    private stage: number = 0;

    constructor(private el: HTMLElement) {
    }

    onReadyToVote(callback: Function) {
        this.readyCallback = callback;
    }
    onReadyToClose(callback: Function) {
        this.closeCallback = callback;
    }

    init() {
        this.fetchData()
            .then((response: VotingSrcData) => {
                this.stage = this.getCurrentStage();
                let step: VotingStage = VotingStage.SELECT_TO_VOTING;
                let formattedCandidates: CandidateData[] = this.populateCandidates(response.candidates);
                let groups: Map<string, CandidateData[]>;

                if (formattedCandidates.length !== response.candidates.length) {
                    if (formattedCandidates.length > 1 && formattedCandidates.length % 2 === 0)
                        step = VotingStage.VOTING
                    else step = VotingStage.WINNER;
                }

                let title: string = `<h1>Voting: <smaller>${VotingLocalization[step].replace("{stage}", this.stage)}</smaller></h1>`
                let html: string = "";
                switch (step) {
                    case VotingStage.SELECT_TO_VOTING: {
                        this.el.innerHTML = title + Renderer.renderCandidateList(formattedCandidates, {
                            readonly: false
                        });
                        break;
                    }
                    case VotingStage.WINNER: {
                        this.el.innerHTML = title + Renderer.renderWinnerList(formattedCandidates);
                        break;
                    }
                    default: {
                        groups = this.getCandidatesByGroups(formattedCandidates);
                        this.el.innerHTML = title + Renderer.renderCandidateListByGroups(groups, {
                            readonly: false
                        });

                        let checkboxEls:HTMLInputElement[] = Array.from(this.el.querySelectorAll(".js-voting-item"));
                        checkboxEls.forEach((checkbox: HTMLInputElement) => {
                            checkbox.addEventListener("change", function () {
                                if (this.checked && this.dataset.group) {
                                    checkboxEls.filter((chbx: HTMLInputElement) =>
                                        chbx.dataset.group === this.dataset.group && this.dataset.id !== chbx.dataset.id)
                                        .forEach((chbx: HTMLInputElement) => {
                                            chbx.checked = false
                                        })
                                }
                            })
                        })
                        break;
                    }
                }

                step !== VotingStage.WINNER ? (this.readyCallback && this.readyCallback()) : (this.closeCallback && this.closeCallback());
            })
    }

    private fetchData(): Promise<VotingSrcData> {
        return fetch('data.json')
            .then((response) => {
                return response.json();
            })
    }

    private getCandidatesByGroups(candidates: CandidateData[]): Map<string, CandidateData[]> {
        let groups: Map<string, CandidateData[]> = new Map();

        candidates.forEach(candidate => {
            let key: string = candidate.group;

            let oldArr: CandidateData[] = groups.get(key) || [];
            oldArr.push(candidate);
            groups.set(key, oldArr);
        })
        return groups;
    }

    private populateCandidates(candidates: CandidateData[]): CandidateData[] {
        let votes: number[] = this.getVotedIdx();
        let available = this.getAvailableIdx();

        if (available !== null) {
            candidates = available.map((idx, index) => {
                candidates[idx].group = String(index >> 1);
                return candidates[idx];
            })
        }

        return candidates.map((item, index) => {
            item.index = index;
            item.selected = votes.some(idx => idx === index);
            return item;
        });
    }

    private getCurrentStage(): number {
        const urlParams = new URLSearchParams(window.location.search);
        return Number(urlParams.get('stage') || "0");
    }

    private getVotedIdx(): number[] {
        const urlParams = new URLSearchParams(window.location.search);
        const votes: string = urlParams.get('votes') as string || "";

        return votes.split("")
            .map((item, index) => item === "1" ? index : -1)
            .filter(item => item >= 0)
    }

    private getAvailableIdx(): number[] | null {
        const urlParams = new URLSearchParams(window.location.search);
        const available: string | null = urlParams.get('available') as string;
        if (available === null) {
            return null
        }
        const len: number = available.length;
        let res: number[] = [];

        for (let i = 0; i < len; i += 2) {
            res.push(Number(available[i] + available[i + 1]));
        }
        return res;
    }

    public getSelected(): {
        stage: number,
        votes: string
    } {
        let len: number = document.querySelectorAll(".js-voting-item").length,
            res: string = "";

        for (let i = 0; i < len; i++) {
            let candidate: HTMLInputElement = document.querySelector(`.js-voting-item[data-id='${i}']`) as HTMLInputElement;

            res += candidate && candidate.checked ? "1" : "0";
        }

        return {
            stage: this.stage,
            votes: res || "0"
        };
    }
}
