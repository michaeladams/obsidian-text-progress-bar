import { 
    Notice
} from 'obsidian'

const emojiRegex = /\p{Emoji}/u

export class ProgressBar {

    /*
    transition:#█░▒▓
    fill:-
    empty: 
    prefix:[
    suffix:]
    length:10
    */

    private _fill: string // character representing the filled progress.
    private _length: number // length of bar in characters.
    private _transition: string[] // between filled and empty, comma separated.
    label: string
    done: number
    total: number

    empty: string // character for unfilled progress.
    prefix: string // character prefixing the bar.
    suffix: string // character suffixing the bar.
    

    labelHide: Boolean

    constructor(label: string, done: number, total: number) {
        this.label = label
        this.done = done
        this.total = total
    }

    get fill(): string {
        return this._fill
    }

    set fill(value: string) {
        this._fill = value
    }

    get length(): number {
        return this._length > 0 ? this._length : this.total
    }

    set length(value: number) {
        this._length = value
    }

    get transition(): string {
        return this._transition.join(",")
    }

    set transition(value: string) {
        this._transition = value.split(",")
    }

    renderTransition(): string {
        return this._transition[Math.floor(this.getRemainder() * this._transition.length)]
    }

    getDonePercent(): number {
        return (this.done / this.total) * 100
    }

    getRemainder(): number {
        return ((this.done / this.total) * this.length) % 1
    }

    getDoneParts(): number {
        return Math.min(Math.floor((this.done / this.total) * this.length), this.length)
    }

    renderBar(container: HTMLElement): HTMLElement {
        // Render the output of the bar.
        container.innerHTML = this.labelHide ? '' : `<span class="label">${this.label}</span>`
        
        const bar = document.createElement("span")
        bar.className = "bar"

        if (this.fill.match(emojiRegex)) {
            bar.className += " has-emoji"
        }

        bar.innerHTML = this.prefix

        let complete = 0
        complete = this.getDoneParts()
        
        for (let index = 0; index < this.length; index++) {

            let bit = bar.createEl("span")
            
            if (index < complete || complete === this.length) {
                bit.className = "filled"
                bit.innerHTML = this.fill
            } else {
                bit.className = "empty"
                bit.innerHTML = (complete === index && this.getRemainder()) ? this.renderTransition(): this.empty
            }

        }

        bar.innerHTML += this.suffix

        return bar
    }

}