import type { DraftL } from './Draft'
import type { Executable } from './Executable'
import type { LibraryFile } from 'src/cards/LibraryFile'
import type { CushyAppT } from 'src/db/TYPES.gen'
import type { CushyScriptL } from 'src/models/CushyScriptL'

import { existsSync, readFileSync } from 'fs'
import { basename, extname, join } from 'pathe'

import { generateAvatar } from '../cards/AvatarGenerator'
import { LiveCollection } from 'src/db/LiveCollection'
import { LiveInstance } from 'src/db/LiveInstance'
import { LiveRef } from 'src/db/LiveRef'
import { SQLITE_false, SQLITE_true } from 'src/db/SQLITE_boolean'
import { VirtualHierarchy } from 'src/panels/libraryUI/VirtualHierarchy'
import { hashArrayBuffer } from 'src/state/hashBlob'
import { toastError, toastSuccess } from 'src/utils/misc/toasts'

export interface CushyAppL extends LiveInstance<CushyAppT, CushyAppL> {}
export class CushyAppL {
    // linked scripts
    private _scriptL: LiveRef<this, CushyScriptL> = new LiveRef(this, 'scriptID', () => this.db.cushy_scripts)
    get script() {
        return this._scriptL.item
    }

    get canBePublishedByUser(): boolean {
        if (this.file == null) return false
        if (this.file.relPath.startsWith('library/built-in')) return false
        if (this.file.relPath.startsWith('library/installed')) return false
        if (this.file.relPath.startsWith('library/sdk-examples')) return false
        return true
    }

    // link drafts
    private _draftsCollection = new LiveCollection<DraftL>({
        table: () => this.db.drafts,
        where: () => ({ appID: this.id }),
    })

    get virtualFolder(): string {
        const pieces = this.name.split('/')
        pieces.pop()
        return pieces.join('/')
    }

    get drafts(): DraftL[] {
        return this._draftsCollection.items
    }

    /** true if in the library/local folder */
    get isLocal(): boolean {
        return this.script.relPath.startsWith('library/local')
    }

    /** true if in the library/local folder */
    get isExample(): boolean {
        return this.script.relPath.startsWith('library/sdk-examples')
    }

    /** true if in built-in  */
    get isBuiltIn(): boolean {
        return this.script.relPath.startsWith('library/built-in')
    }

    /** shortcut to open the last draft of the first app defined in this file */
    openLastOrCreateDraft = () => {
        this.getLastOrCreateDraft().openOrFocusTab()
    }

    subFolderStructure = new VirtualHierarchy<DraftL>(() => this.drafts)
    // --------------------------------------------

    getLastOrCreateDraft = (): DraftL => {
        const drafts = this.drafts
        return drafts.length > 0 ? drafts[0] : this.createDraft()
    }

    // favorite system ------------------------------------------------------
    get isFavorite(): boolean {
        return this.data.isFavorite === SQLITE_true
    }

    setFavorite = (fav: boolean) => {
        this.update({ isFavorite: fav ? SQLITE_true : SQLITE_false } /* { debug: true } */)
    }

    // ... ------------------------------------------------------
    createDraft = (): DraftL => {
        const title = this.name + ' ' + this._draftsCollection.items.length + 1
        const draft = this.st.db.drafts.create({
            // @ts-expect-error 🔴
            formSerial: {},
            appID: this.id,
            title: title,
        })
        this.st.layout.FOCUS_OR_CREATE('Draft', { draftID: draft.id }, 'LEFT_PANE_TABSET')
        return draft
    }

    /** true if file match current library search */
    matchesSearch = (search: string): boolean => {
        if (search === '') return true
        const searchLower = search.toLowerCase()
        const nameLower = this.name.toLowerCase()
        const descriptionLower = this.description.toLowerCase()
        return nameLower.includes(searchLower) || descriptionLower.includes(searchLower)
    }

    get isLoadedInMemory() {
        return this.script.getExecutable_orNull(this.id) != null
    }

    get executable_orNull(): Maybe<Executable> {
        return this.script.getExecutable_orNull(this.id)
    }

    get executable_orExtract(): Maybe<Executable> {
        return this.script.getExecutable_orExtract(this.id)
    }

    // get possiblyAlreadyCachedexecutable(): Maybe<Executable> {
    //     return this.script.getExecutable_orNull(this.id)
    // }

    // PUBLISHING ---------------------------------------------------------------------------
    isPublishing = false
    FAIL_prepublish = (summary: string, howToFix?: string): never => {
        const title = `[🚀] ❌ pre-publish check failed: ${summary}`
        console.log(title)
        toastError(title)
        throw new Error([title, howToFix].join('\n'))
    }

    revealInFileExplorer = () => {
        const relPath = this.relPath
        if (relPath == null) return
        const treePath = relPath.split('/')
        treePath.shift()
        treePath.push(this.id)
        this.st.tree2View.revealAndFocusAtPath(treePath)
    }

    publish = async () => {
        if (this.isPublishing) return
        this.isPublishing = true
        try {
            const st = this.st
            const x = this.executable_orExtract

            // ensure app is compiled
            if (x == null) {
                return this.FAIL_prepublish(`no valid compiled app found`)
            }

            // ensure valid metadata
            if (
                x.illustration == null || //
                x.name == null ||
                x.description == null
            ) {
                console.error(this.executable_orExtract?.metadata)
                return this.FAIL_prepublish(
                    `missing metadata (${(['illustration', 'name', 'description'] as const)
                        .filter((y) => x[y] == null)
                        .join(', ')})`,
                    [
                        ` | app({`,
                        ` |     metadata: {`,
                        ` |    👉   name: 'Cushy Diffusion UI',`,
                        ` |    👉   illustration: IMG,`,
                        ` |    👉   description: 'A card that contains all the features needed to play with stable diffusion',`,
                        ` |     },`,
                        ` |     ui: (ui) => ({`,
                        ` |        ...`,
                    ].join('\n'),
                )
            }

            // ensure illustration is valid
            if (x.illustration.startsWith('data:')) {
                return this.FAIL_prepublish(
                    'invalid illustration',
                    'illustration must be a path to a local file, not a base64 encoded image',
                )
            }

            // 1. ensure user is logged in
            const supa = st.supabase
            const user_id = st.auth.user?.id
            if (user_id == null) throw new Error('not logged in')
            console.log(`[🚀] ✅ logged-in`)

            // 2. retrieve the app short-name
            const appUID = `${user_id}/${this.id}`
            console.log(`[🚀] ✅ starting publish flow for app ${appUID}`)

            // 3. fetch the currently published app f
            const prevRes = await supa
                .from('published_apps') //
                .select('*')
                .eq('user_id', user_id)
                .eq('app_id', this.id)

            if (prevRes.error) {
                console.log(`[🚀] publish failed due to some postgres error`, prevRes.error)
                throw prevRes.error
            }

            // get prevPayload
            const prev = prevRes.data.at(0)

            // publish image to supabase
            const illustration = x.illustration
            const illustrationPath = illustration.startsWith('file://') //
                ? illustration.slice('file://'.length)
                : illustration

            //
            const imageExtension = extname(illustrationPath)
            const validExtensions = ['.png', '.jpg', '.jpeg']
            if (!validExtensions.includes(imageExtension)) {
                return this.FAIL_prepublish(
                    'invalid illustration',
                    ` | illustration must be a png or jpg file, not a ${imageExtension} file`,
                )
            }

            // ensure image exists -------------------------------------------------
            const exists = existsSync(illustrationPath)
            if (!exists)
                return this.FAIL_prepublish('illustration file not found', ` | no image found from path "${illustrationPath}"`)
            const imageBuffer = readFileSync(illustrationPath)
            const hash = await hashArrayBuffer(imageBuffer)
            const bucketPath = `${user_id}/${hash}${imageExtension}`
            const { data, error } = await supa.storage //
                .from('Apps')
                .upload(bucketPath, imageBuffer, { cacheControl: '3600', upsert: false })
            if (
                error && //
                error.message !== 'The resource already exists' &&
                (error as any).error !== 'Duplicate'
            ) {
                console.error(error.message === 'The resource already exists')
                throw new Error(`[🚀] ❌ publish failed due to some storage error`, error)
            }
            console.log(`[🚀] ✅ illustration ${bucketPath} uploaded !`)
            const illustration_url = supa.storage.from('Apps').getPublicUrl(bucketPath).data.publicUrl
            console.log(`[🚀] ✅ illustration public url is ${illustration_url}`)

            // ensure image exists -------------------------------------------------
            if (prev == null) {
                console.log(`[🚀] no published app for ${appUID} found; publishing...`)
                const res = await supa.from('published_apps').insert({
                    user_id,
                    app_id: this.id,
                    name: this.name,
                    description: this.description,
                    illustration_url: illustration_url,
                    tags: this.executable_orExtract?.tags,
                })
                console.log(`[🚀] ✅ ${appUID} published !`, res)
                toastSuccess(`[🚀] ✅ ${appUID} published !`)
            } else {
                //
                console.log(`[🚀] app found`, prev, 'updating...')
                const res = await supa
                    .from('published_apps') //
                    .update({
                        app_id: this.id,
                        name: this.name,
                        description: this.description,
                        illustration_url: illustration_url,
                        tags: this.executable_orExtract?.tags,
                    })
                    .eq('id', prev.id)
                console.log(`[🚀] ✅ ${appUID} updated !`, res)
                toastSuccess(`[🚀] ✅ ${appUID} updated !`)
            }
            this.update({
                publishedAsUserID: user_id,
                publishedAt: Date.now(),
            })
        } catch (e: unknown) {
            const err = e as Error
            toastError(err.message ?? `[🚀] ❌ publish failed !`)
            console.error(`[🚀] ❌ publish failed !`)
            console.error(e)
        } finally {
            this.isPublishing = false
        }
    }

    /** globaly unique id (in theory...); 🔶 */
    get uid() {
        return this.data.createdAt
    }

    get name(): string {
        if (this.data.name) return this.data.name
        // if (this.executable?.metadata?.name) return this.executable.metadata.name

        // take basename as name
        const relPath = this.script.relPath
        let name = basename(relPath)

        // remove the extension
        name = name.endsWith('.ts') //
            ? name.slice(0, -3)
            : name

        // support for https://comfyworkflows.com/ downloaded workflows
        if (name.match(/comfyworkflows_[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/)) {
            name = `ComfyWorkflow ${name.slice(-12, -4)}`
        }

        return name
    }

    /** retlative path to the script this app comes from */
    get relPath(): RelativePath {
        return this._scriptL.item.relPath
    }

    /** quick way to access the LibraryFile this app script comes from */
    get file(): LibraryFile {
        return this.st.library.getFile(this.relPath)
    }

    /** app description */
    get description(): string {
        return this.data.description /*?? this.executable?.description*/ ?? '<no description>'
    }

    /** action display name */
    get illustrationPath_eiter_RelativeToDeckRoot_or_Base64Encoded_or_SVG(): Maybe<string> {
        // if (this.executable?.metadata?.illustration) return this.executable.metadata.illustration
        if (this.data.illustration) return this.data.illustration
        if (this.relPath.endsWith('.png')) return this.relPath
        return generateAvatar(this.relPath)
    }

    /** ready to be used in URL */
    get illustrationPathWithFileProtocol() {
        const tmp = this.illustrationPath_eiter_RelativeToDeckRoot_or_Base64Encoded_or_SVG
        if (tmp?.startsWith('data:')) return tmp
        if (tmp?.startsWith('http')) return tmp
        if (tmp?.startsWith('<svg')) throw new Error('SVG not supported')
        if (tmp) {
            if (tmp.startsWith('/')) return `file://${tmp}`
            return `file://${join(this.st.rootPath, tmp)}`
        }
        // default illustration if none is provided
        return `file://${join(this.st.rootPath, 'library/CushyStudio/default/_illustrations/default-card-illustration.jpg')}`
    }
}
