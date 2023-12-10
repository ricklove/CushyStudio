import type { StepOutput } from 'src/types/StepOutput'
import type { LiveInstance } from '../db/LiveInstance'
import type { ComfyWorkflowL } from '../models/Graph'
import type { ComfyPromptL } from './ComfyPrompt'

import { LibraryFile } from 'src/cards/LibraryFile'
import { StepT } from 'src/db/TYPES.gen'
import { Runtime } from '../back/Runtime'
import { Status } from '../back/Status'
import { LiveCollection } from '../db/LiveCollection'
import { LiveRef } from '../db/LiveRef'
import { Media3dDisplacementL } from './Media3dDisplacement'
import { MediaImageL } from './MediaImage'
import { MediaTextL } from './MediaText'
import { MediaVideoL } from './MediaVideo'
import { RuntimeErrorL } from './RuntimeError'
import { MediaSplatL } from './MediaSplat'
import { Widget_group } from 'src/controls/Widget'
import { SQLITE_false, SQLITE_true } from 'src/db/SQLITE_boolean'
import { CushyAppL } from './CushyApp'
import { App, WidgetDict } from 'src/cards/App'

export type FormPath = (string | number)[]
/** a thin wrapper around an app execution */
export interface StepL extends LiveInstance<StepT, StepL> {}
export class StepL {
    start = async (p: {
        /**
         * reference to the draft live form instance
         * this will be made available to the runtime so the runtime can access
         * the live form
         * */
        formInstance: Widget_group<any>
    }) => {
        const action = this.appCompiled
        if (action == null) return console.log('🔴 no action found')

        // this.data.outputGraphID = out.id
        this.runtime = new Runtime(this)
        this.update({ status: Status.Running })
        const scriptExecutionStatus = await this.runtime.run(p)

        if (this.comfy_prompts.items.every((p: ComfyPromptL) => p.data.executed)) {
            this.update({ status: scriptExecutionStatus })
        }
    }

    get finalStatus(): Status {
        if (this.status !== Status.Success) return this.status
        return this.comfy_prompts.items.every((p: ComfyPromptL) => p.data.executed) //
            ? Status.Success
            : Status.Running
    }

    appL = new LiveRef<this, CushyAppL>(this, 'appID', () => this.db.cushy_apps)

    get app(): CushyAppL {
        return this.appL.item
    }

    get status(): Status {
        return this.data.status as Status
    }

    get appCompiled(): Maybe<App<WidgetDict>> {
        return this.app.executable
    }

    get name(): string {
        return this.data.name ?? this.app.name
    }

    get generatedImages(): MediaImageL[] {
        return this.images.items
    }

    outputWorkflow = new LiveRef<this, ComfyWorkflowL>(this, 'outputGraphID', () => this.db.graphs)

    private _CACHE_INVARIANT = () => this.data.status !== Status.Running

    texts =           new LiveCollection<MediaTextL>          ({table: () => this.db.media_texts,           where: () => ({stepID:this.id}), cache: this._CACHE_INVARIANT}) // prettier-ignore
    images =          new LiveCollection<MediaImageL>         ({table: () => this.db.media_images,          where: () => ({stepID:this.id}), cache: this._CACHE_INVARIANT}) // prettier-ignore
    videos =          new LiveCollection<MediaVideoL>         ({table: () => this.db.media_videos,          where: () => ({stepID:this.id}), cache: this._CACHE_INVARIANT}) // prettier-ignore
    displacements =   new LiveCollection<Media3dDisplacementL>({table: () => this.db.media_3d_displacement, where: () => ({stepID:this.id}), cache: this._CACHE_INVARIANT}) // prettier-ignore
    splats =          new LiveCollection<MediaSplatL>         ({table: () => this.db.media_splats,          where: () => ({stepID:this.id}), cache: this._CACHE_INVARIANT}) // prettier-ignore
    comfy_workflows = new LiveCollection<ComfyWorkflowL>      ({table: () => this.db.graphs,                where: () => ({stepID:this.id}), cache: this._CACHE_INVARIANT}) // prettier-ignore
    comfy_prompts =   new LiveCollection<ComfyPromptL>        ({table: () => this.db.comfy_prompts,         where: () => ({stepID:this.id}), cache: this._CACHE_INVARIANT}) // prettier-ignore
    runtimeErrors =   new LiveCollection<RuntimeErrorL>       ({table: () => this.db.runtimeErrors,         where: () => ({stepID:this.id}), cache: this._CACHE_INVARIANT}) // prettier-ignore

    get currentlyExecutingOutput(): Maybe<StepOutput> {
        return this.comfy_prompts.items.find((p: ComfyPromptL) => !p.data.executed)
    }
    get lastMediaOutput(): Maybe<StepOutput> {
        const outputs = this.outputs
        const last = outputs[outputs.length - 1]
        if (
            last instanceof MediaImageL || //
            last instanceof MediaVideoL ||
            last instanceof Media3dDisplacementL ||
            last instanceof MediaTextL ||
            last instanceof MediaImageL
        )
            return last

        return null
    }
    get lastOutput(): Maybe<StepOutput> {
        const outputs = this.outputs
        return outputs[outputs.length - 1]
    }
    get outputs(): StepOutput[] {
        return [
            //
            ...this.texts.items,
            ...this.images.items,
            ...this.videos.items,
            ...this.splats.items,
            ...this.displacements.items,
            ...this.comfy_workflows.items,
            ...this.comfy_prompts.items,
            ...this.runtimeErrors.items,
        ].sort((a, b) => a.createdAt - b.createdAt)
    }

    runtime: Maybe<Runtime> = null

    // get collage() {
    //     const imgs = this.generatedImages
    //     const last = imgs[imgs.length - 1]
    //     if (last == null) return
    //     if (this.focusedOutput == null) return this.generatedImages
    // }

    recordError = (message: string, infos: any) => {
        this.db.runtimeErrors.create({
            stepID: this.id,
            graphID: this.outputWorkflow.id,
            message,
            infos,
        })
    }

    // UI expand/collapse state
    get defaultExpanded(): boolean {
        return this.data.isExpanded === SQLITE_true ? true : false
    }
    userDefinedExpanded: Maybe<boolean> = null
    get expanded() {
        return this.userDefinedExpanded ?? this.defaultExpanded
    }
    set expanded(next: boolean) {
        this.update({ isExpanded: next ? SQLITE_true : SQLITE_false })
    }
}
