import "./styles.scss"

import { ProgressBar } from "./bar"

import { 
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting
} from 'obsidian'


const labelRegex = /(?<label>.+):\s*(?<done>(\d+\.?\d*|\d*\.?\d+))\/(?<total>(\d+\.?\d*|\d*\.?\d+))/

interface ObjectKeys {
    [key: string]: string | number | boolean
}

interface TextProgressSettings extends ObjectKeys {
    transition: string
    fill: string
    empty: string
    prefix: string
    suffix: string
    length: number
    labelHide: boolean
}

const DEFAULT_SETTINGS: TextProgressSettings = {
    transition: '🌘,🌗,🌔',
    fill: '🌕',
    empty: '🌑',
    prefix: '',
    suffix: '',
    length: 0,
    labelHide: false
}

export default class TextProgress extends Plugin {
    settings: TextProgressSettings

    labelPosition: string
    progressFormat: string // Percent or absolute.
    progressHide: boolean
    progressPosition: string

    parseLabel(label:string) {

        const matchResult = label.match(labelRegex)

        if (matchResult) {
            const groups = matchResult.groups
            if (groups && groups.label) {
                return {
                    'label': groups.label,
                    'done': +groups.done,
                    'total': +groups.total
                }
            }
        }

        return {'label': '', 'done':0, 'total':0}

    }

    parseSource(rows: string[]) {
        // Other rows are settings for the bar.
        // Formatted like "setting:value"
        const settings:TextProgressSettings = {
            "transition": this.settings.transition,
            "prefix": this.settings.prefix,
            "suffix": this.settings.suffix,
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

        return settings
    }

    async onload() {
        await this.loadSettings()

        this.registerMarkdownCodeBlockProcessor("text-progress-bar", async (source: string, el: HTMLElement, ctx) => {

            const rows = source.trim().split("\n")

            // First row should be label/progress/done.
            const label = rows.shift()

            if (label !== undefined) {
                const parsedLabel = this.parseLabel(label)
                if (!parsedLabel) {
                    new Notice('Could not find label in correct format.')
                }

                const bar = new ProgressBar(parsedLabel.label, parsedLabel.done, parsedLabel.total)

                const settings = this.parseSource(rows)

                bar.transition = settings.transition
                bar.prefix = settings.prefix
                bar.suffix = settings.suffix
                bar.fill = settings.fill
                bar.length = settings.length
                bar.empty = settings.empty
                bar.labelHide = String(settings.labelHide).toLowerCase() === "true"
                
                const container = el.createEl("section")
                container.className = "text-progress-bar"

                container.appendChild(bar.renderBar(container))

            } else {
                new Notice('No progress bars found.')
            }

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

        containerEl.createEl('h2', {text: 'Settings'})

        new Setting(containerEl)
            .setName('Fill')
            .setDesc('A character representing the filled part of your bar.')
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

        new Setting(containerEl)
            .setName('Transition')
            .setDesc('Enter one or multiple characters (separated by comma) to have a transition between filled and empty.  Eg 🌒,🌓,🌔')
            .addText(text => text
                .setValue(this.plugin.settings.transition)
                .onChange(async (value) => {
                    this.plugin.settings.transition = value
                    await this.plugin.saveSettings()
                }))

        new Setting(containerEl)
            .setName('Prefix')
            .setDesc('Enter a prefix to start your bar with.  Eg "["')
            .addText(text => text
                .setValue(this.plugin.settings.prefix)
                .onChange(async (value) => {
                    this.plugin.settings.prefix = value
                    await this.plugin.saveSettings()
                }))

        new Setting(containerEl)
            .setName('Suffix')
            .setDesc('Enter a suffix to end your bar with.  Eg "]"')
            .addText(text => text
                .setValue(this.plugin.settings.suffix)
                .onChange(async (value) => {
                    this.plugin.settings.suffix = value
                    await this.plugin.saveSettings()
                }))

        new Setting(containerEl)
            .setName('Hide labels')
            .setDesc('If labels should be hidden or shown')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.labelHide).onChange(async (newState) => {
                    this.plugin.settings.labelHide = newState
                    await this.plugin.saveSettings()
                })
            })


    }
}
