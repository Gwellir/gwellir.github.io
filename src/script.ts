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
    SELECT_TO_VOTING = 0
}

class Renderer {
    static renderCandidateView(candidate: CandidateData, options: {
        readonly: boolean,
        inGroup: boolean,
    }): string {
        let id: string = `candidate${candidate.index}`;
        let selectionInputHTML: string = options.inGroup ?
            `type="radio" name="group${candidate.group}" value="candidate${candidate.index}"` :
            `type="checkbox" name="candidate${candidate.index}" value="1"`;
        return `<label for="${id}" class="candidate">
<input ${selectionInputHTML} class="js-voting-item" id="${id}" data-id="${candidate.index}" ${options.readonly ? 'readonly' : ''} ${candidate.selected ? 'checked' : ''}/>
<div class="candidate-card">
<div class="candidate-card__img"><img src="${candidate.img}" alt="${candidate.name}"></div>            
            <div class="candidate-card__data">
                <span class="candidate-card__name">${candidate.name}</span>
                <span class="candidate-cQard__src">${candidate.source}</span>            
            </div>            
        </div>
        </label>`
    }

    static renderCandidateList(candidates: CandidateData[], options: {
        readonly: boolean,
        byGroups: boolean
    }): string {
        return `
<h1>Voting</h1>
      <h4>Candidates</h4>
      <!-- Список кандидатов, отображение img, name, source, после сидинга, вероятно, seed number -->
      <form class="candidates">${candidates.map(item =>
            Renderer.renderCandidateView(item, {
                inGroup: options.byGroups,
                readonly: options.readonly
            })
        ).join("")}</form>
`
    }
}

class Voting {
    private readyCallback: Function | null = null;

    constructor(private el: HTMLElement) {}

    onReady(callback: Function) {
        this.readyCallback = callback;
    }

    init() {
        this.fetchData()
            .then((response: VotingSrcData) => {
                this.el.innerHTML = Renderer.renderCandidateList(this.populateCandidates(response.candidates), {
                    readonly: false,
                    byGroups: response.stage !== VotingStage.SELECT_TO_VOTING
                })

                this.readyCallback && this.readyCallback();
            })
    }

    private fetchData(): Promise<VotingSrcData> {
        return fetch('data.json')
            .then((response) => {
                return response.json();
            })
    }

    private populateCandidates(candidates: CandidateData[]): CandidateData[] {
        const urlParams = new URLSearchParams(window.location.search);
        const votes: string = urlParams.get('votes') as string || "";

        return candidates.map((item, index) => {
            item.index = index;
            item.selected = votes[index] === "1";
            return item;
        });

        return candidates;
    }

    public getSelected(): string {
        let len: number = document.querySelectorAll(".js-voting-item").length,
            res: string = "";

        for (let i = 0; i < len; i++) {
            let candidate: HTMLInputElement = document.querySelector(`.js-voting-item[data-id='${i}']`) as HTMLInputElement;

            res += candidate && candidate.checked ? "1" : "0";
        }

        return res;
    }
}
