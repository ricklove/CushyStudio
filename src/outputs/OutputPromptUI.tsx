import { observer } from 'mobx-react-lite'
import { Button } from 'src/rsuite/shims'
import { ImageUI } from '../widgets/galleries/ImageUI'
import { GraphSummaryUI } from '../widgets/workspace/GraphSummaryUI'
import { useSt } from 'src/state/stateContext'
import { StepOutput_Prompt } from 'src/types/MessageFromExtensionToWebview'
import { StepL } from 'src/models/Step'
import { OutputPreviewWrapperUI } from './OutputWrapperUI'

export const OutputPromptUI = observer(function OutputPromptUI_(p: {
    //
    step: StepL
    output: StepOutput_Prompt
}) {
    const msg = p.output
    const st = useSt()
    const db = st.db

    const prompt = db.prompts.get(msg.promptID)
    const graph = prompt?.graph.item
    if (graph == null) return <>no graph</>
    // const currNode = graph.currentExecutingNode
    return (
        <div className='flex flex-col gap-1'>
            <div className='flex flex-wrap'>
                {prompt?.images.map((img) => (
                    <ImageUI key={img.id} img={img} />
                ))}
            </div>
            {/* {currNode && <ComfyNodeUI node={currNode} />} */}
            {graph.done ? null : (
                <Button
                    tw='self-end'
                    size='xs'
                    appearance='ghost'
                    onClick={() => {
                        st.stopCurrentPrompt()
                    }}
                >
                    STOP GENERATING
                </Button>
            )}
            <GraphSummaryUI graph={graph} />
        </div>
    )
})

export const OutputPromptPreviewUI = observer(function OutputPromptPreviewUI_(p: { step: StepL; output: StepOutput_Prompt }) {
    return (
        <OutputPreviewWrapperUI output={p.output}>
            <div>Prompt</div>
            <OutputPromptUI step={p.step} output={p.output} />
        </OutputPreviewWrapperUI>
    )
})
