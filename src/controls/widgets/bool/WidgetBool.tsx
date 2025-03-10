import type { Form } from '../../Form'
import type { IWidget, WidgetConfigFields, WidgetSerialFields } from '../../IWidget'

import { computed, makeObservable, observable } from 'mobx'
import { nanoid } from 'nanoid'
import { hash } from 'ohash'

import { WidgetDI } from '../WidgetUI.DI'

// CONFIG
export type Widget_bool_config = WidgetConfigFields<{
    default?: boolean
    label2?: string
}>

// SERIAL
export type Widget_bool_serial = WidgetSerialFields<{ type: 'bool'; active: boolean }>

// OUT
export type Widget_bool_output = boolean

// TYPES
export type Widget_string_types = {
    $Type: 'bool'
    $Input: Widget_bool_config
    $Serial: Widget_bool_serial
    $Output: Widget_bool_output
}

// STATE
export interface Widget_bool extends Widget_string_types {}
export class Widget_bool implements IWidget<Widget_string_types> {
    readonly isCollapsible = false
    readonly id: string
    readonly type: 'bool' = 'bool'

    serial: Widget_bool_serial
    get serialHash(): string {
        return hash(this.value)
    }
    setOn = () => (this.serial.active = true)
    setOff = () => (this.serial.active = false)
    toggle = () => (this.serial.active = !this.serial.active)

    constructor(public form: Form<any>, public config: Widget_bool_config, serial?: Widget_bool_serial) {
        this.id = serial?.id ?? nanoid()
        this.serial = serial ?? {
            id: this.id,
            type: 'bool',
            active: config.default ?? false,
            collapsed: config.startCollapsed,
        }

        makeObservable(this, {
            serial: observable,
            value: computed,
        })
    }

    get value(): Widget_bool_output {
        return this.serial.active ?? false
    }
    set value(next: Widget_bool_output) {
        this.serial.active = next
    }
}

// DI
WidgetDI.Widget_bool = Widget_bool
