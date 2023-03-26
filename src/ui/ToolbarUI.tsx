import {
    Toolbar,
    ToolbarButton,
    ToolbarDivider,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
    ToolbarProps,
} from '@fluentui/react-components'
import * as I from '@fluentui/react-icons'
import { observer } from 'mobx-react-lite'
import { useCS } from '../config/CushyStudioContext'
import { useWorkspace } from './WorkspaceContext'

export const ToolbarUI = observer(function ToolbarUI_(props: Partial<ToolbarProps>) {
    const cushy = useCS()
    const client = useWorkspace()
    const project = client.script
    return (
        <Toolbar aria-label='Default' {...props}>
            <ToolbarButton
                disabled={project == null}
                aria-label='Increase Font Size'
                appearance='primary'
                icon={<I.Play24Filled />}
                onClick={() => project?.RUN('real')}
            />
            <ToolbarButton
                disabled={project == null}
                aria-label='Decrease Font Size'
                icon={<I.DesktopToolboxRegular />}
                onClick={() => project?.RUN('fake')}
            />
            {/* <ToolbarButton aria-label='Reset Font Size' icon={<I.TextFont24Regular />} /> */}
            <ToolbarButton
                onClick={() => {
                    //
                    throw new Error('not implemented')
                    // const editor = client.editor.editorRef.current
                    // if (editor == null) return console.log('❌ editor is null')
                    // const otps = editor.getRawOptions().wordWrap
                    // editor.updateOptions({ wordWrap: otps === 'off' ? 'on' : 'off' })
                }}
                aria-label='Toogle word wrap'
                icon={<I.TextWrap24Filled />}
            />
            <ToolbarDivider />
            <Menu>
                <MenuTrigger>
                    <ToolbarButton aria-label='More' icon={<I.MoreHorizontal24Filled />} />
                </MenuTrigger>

                <MenuPopover>
                    <MenuList>
                        <MenuItem>New </MenuItem>
                        <MenuItem>New Window</MenuItem>
                        <MenuItem disabled>Open File</MenuItem>
                        <MenuItem>Open Folder</MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>
            <ToolbarButton icon={<I.ClosedCaption24Filled />} onClick={cushy.closeWorkspace}>
                Close workspace
            </ToolbarButton>
            <ToolbarButton
                aria-label='Increase Font Size'
                icon={<I.PhoneUpdate24Regular />}
                onClick={async () => {
                    // may not correctly work
                    const { relaunch } = await import('@tauri-apps/api/process')
                    await relaunch()
                }}
            >
                Restart
            </ToolbarButton>
        </Toolbar>
    )
})
