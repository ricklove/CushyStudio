
declare type TableNameInDB =
    | 'migrations'
    | 'users'
    | 'graph'
    | 'draft'
    | 'project'
    | 'step'
    | 'comfy_prompt'
    | 'comfy_schema'
    | 'media_text'
    | 'media_video'
    | 'media_image'
    | 'media_3d_displacement'
    | 'runtime_error'
    | 'media_splat'
    | 'custom_data'
    | 'cushy_script'
    | 'cushy_app'
    | 'auth'
    | 'tree_entry'
    | 'host'

declare type MigrationsID = Branded<string, { MigrationsID: true }>
declare type UsersID = Branded<string, { UsersID: true }>
declare type GraphID = Branded<string, { GraphID: true }>
declare type DraftID = Branded<string, { DraftID: true }>
declare type ProjectID = Branded<string, { ProjectID: true }>
declare type StepID = Branded<string, { StepID: true }>
declare type ComfyPromptID = Branded<string, { ComfyPromptID: true }>
declare type ComfySchemaID = Branded<string, { ComfySchemaID: true }>
declare type MediaTextID = Branded<string, { MediaTextID: true }>
declare type MediaVideoID = Branded<string, { MediaVideoID: true }>
declare type MediaImageID = Branded<string, { MediaImageID: true }>
declare type Media3dDisplacementID = Branded<string, { Media3dDisplacementID: true }>
declare type RuntimeErrorID = Branded<string, { RuntimeErrorID: true }>
declare type MediaSplatID = Branded<string, { MediaSplatID: true }>
declare type CustomDataID = Branded<string, { CustomDataID: true }>
declare type CushyScriptID = Branded<string, { CushyScriptID: true }>
declare type CushyAppID = Branded<string, { CushyAppID: true }>
declare type AuthID = Branded<string, { AuthID: true }>
declare type TreeEntryID = Branded<string, { TreeEntryID: true }>
declare type HostID = Branded<string, { HostID: true }>
