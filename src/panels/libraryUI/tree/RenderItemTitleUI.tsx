import { observer } from 'mobx-react-lite'
import type { TreeInformation, TreeItem, TreeItemRenderContext } from 'react-complex-tree'
import type { ITreeEntry } from './TreeEntry'
import { createElement } from 'react'
import { TreeIcon1UI } from './RenderTreeIcon1'

export const RenderItemTitleUI = observer(function RenderItemTitleUI_(x: {
    //
    title: string
    item: TreeItem<ITreeEntry>
    context: TreeItemRenderContext<never>
    info: TreeInformation
}) {
    const item = x.item
    let icon = item.data.icon
    if (typeof icon === 'string') {
        icon = <img src={icon} style={{ width: '1.3rem', height: '1.3rem' }} />
        // icon = <span className='material-icons-outlined'>{icon}</span>
    }

    return (
        <div tw='flex flex-grow items-center gap-0.5 whitespace-nowrap overflow-ellipsis'>
            {icon}
            <div tw='flex-grow relative overflow-hidden overflow-ellipsis'>
                &nbsp;
                <div tw='absolute inset-0'>{item.data.name}</div>
            </div>
            <div tw='ml-auto opacity-40 hover:opacity-100'>
                {item.data.extra}
                {item.data.actions?.map((action, ix) => {
                    return <TreeIcon1UI key={ix} {...action} />
                })}
            </div>
        </div>
    )
})
