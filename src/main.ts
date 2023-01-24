import "./styles.scss"

import { 
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting
} from 'obsidian'


const labelRegex = /(?<label>.+):\s*(?<done>\d+)\/(?<total>\d+)/
const emojiRegex = /\p{Emoji}/u

interface ObjectKeys {
    [key: string]: string | number | boolean
}

interface TextProgressSettings extends ObjectKeys {
    transition: string
    fill: string
    empty: string
    open: string
    close: string
    length: number
    labelHide: boolean
}

const DEFAULT_SETTINGS: TextProgressSettings = {
    transition: '🌒,🌓,🌔',
    fill: '🌕',
    empty: '🌑',
    open: '',
    close: '',
    length: 0,
    labelHide: false
}

export default class TextProgress extends Plugin {
    settings: TextProgressSettings
    label: string
    done: number
    total: number
    
    transition: string // between filled and empty.
    private _fill: string[] // character representing the filled progress.
    empty: string // character for unfilled progress.
    open: string // character prefixing the bar.
    close: string // character suffixing the bar.
    length: number // length of bar in characters.
    labelPosition: string
    progressFormat: string // Percent or absolute.
    progressHide: boolean
    progressPosition: string
    

    /*
    transition:#█░▒▓
    fill:-
    empty: 
    open:[
    close:]
    length:10
    */

    get fill(): string {
        return this._fill.join(',')
    }

    set fill(value: string) {
        this._fill = value.split(',')
    }

    renderTransition(): string {
        const transitions = this.transition.split(',')

        const remainder = ((this.done / this.total) * this.length) % 1

        return transitions[Math.floor(remainder * transitions.length)]

    }

    parseLabel(label:string): boolean {

        const matchResult = label.match(labelRegex)

        if (matchResult) {
            const groups = matchResult.groups
            if (groups && groups.label) {
                this.label = groups.label
                this.done = +groups.done
                this.total = +groups.total
                return true
            }
        }

        return false

    }

    highlight(strings: TemplateStringsArray, ...values: string[]) {
        let str = '<span class="label">'
        strings.forEach((string:string, i:number) => {
            str += string + (values[i] !== undefined ? values[i] : '')
        })
        return str + '</span>'
    }

    async onload() {
        await this.loadSettings()

        this.registerMarkdownCodeBlockProcessor("text-progress-bar", async (source: string, el: HTMLElement, ctx) => {

            const rows = source.trim().split("\n")

            // First row should be label/progress.
            const label = rows.shift()

            if (label !== undefined) {
                if (!this.parseLabel(label)) {
                    new Notice('Could not find label in correct format.')
                }
            } else {
                new Notice('No progress bars found.')
            }

            // Other rows are settings for the bar.
            // Formatted like "setting:value"
            const settings:TextProgressSettings = {
                "transition": this.settings.transition,
                "open": this.settings.open,
                "close": this.settings.close,
                "fill": this.settings.fill,
                "empty": this.settings.empty,
                "labelHide": this.settings.labelHide,
                "length": this.settings.length,
            }

            // For each setting in the progress bar, merge with
            // current settings.
            // We split on the first ':' as there could be ':' in
            // the values.
            for(const row in rows) {
                const [first, ...rest] = rows[row].split(':')
                const restJoined:string = rest.join(":")
                settings[first] = restJoined
            }

            this.transition = settings.transition
            this.open = settings.open
            this.close = settings.close
            this.fill = settings.fill
            this.length = settings.length
            this.empty = settings.empty

            // Render the output of the bar.
            const container = document.createElement('section')
            container.className = "text-progress-bar"

            if (this.fill.match(emojiRegex)) {
                container.className += " has-emoji"
            }

            container.innerHTML = this.highlight`${this.settings.labelHide ? '' : this.label}`

            const bar = document.createElement('span')
            bar.className = "bar"
            bar.innerHTML = this.open

            let complete = 0

            this.length = this.length > 0 ? this.length : this.total

            complete = Math.floor((this.done / this.total) * this.length)
            const remainder = ((this.done / this.total) * this.length) % 1
            
            for (let index = 0; index < this.length; index++) {

                const bit = document.createElement('span')

                if (index < complete || complete === this.length) {
                    bit.className = "fill"
                    bit.innerHTML = this.fill
                } else {
                    bit.className = "back"
                    bit.innerHTML = (complete === index && remainder) ? this.renderTransition(): this.empty
                }

                bar.appendChild(bit)

            }

            bar.innerHTML += this.close
            container.appendChild(bar)
            el.appendChild(container)


        })

        // Adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new TextProgressSettingsTab(this.app, this))

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }
}

class TextProgressSettingsTab extends PluginSettingTab {
    plugin: TextProgress

    constructor(app: App, plugin: TextProgress) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const {containerEl} = this

        containerEl.empty()

        containerEl.createEl('h2', {text: 'Settings.'})

        new Setting(containerEl)
            .setName('Fill')
            .setDesc('Enter multiple characters (separated by comma) to have a transition between filled and empty.')
            .addText(text => text
                .setPlaceholder('🌕')
                .setValue(this.plugin.settings.fill)
                .onChange(async (value) => {
                    this.plugin.settings.fill = value
                    await this.plugin.saveSettings()
                }))

        new Setting(containerEl)
            .setName('Empty')
            .setDesc('A character representing the un-filled part of your bar.')
            .addText(text => text
                .setPlaceholder('🌑')
                .setValue(this.plugin.settings.empty)
                .onChange(async (value) => {
                    this.plugin.settings.empty = value
                    await this.plugin.saveSettings()
                }))
    }
}
