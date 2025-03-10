import type { ResolutionState } from './ResolutionState'
import type { Widget_size } from './WidgetSize'
import type { AspectRatio, ModelType } from './WidgetSizeTypes'

import { observer } from 'mobx-react-lite'

import { InputNumberUI } from 'src/controls/widgets/number/InputNumberUI'
import { Joined } from 'src/rsuite/shims'

export const WigetSize_BlockUI = observer(function WigetSize_BlockUI_(p: { widget: Widget_size }) {
    return <WigetSizeXUI sizeHelper={p.widget.sizeHelper} bounds={p.widget.config} />
})

export const WigetSize_LineUI = observer(function WigetSize_LineUI_(p: { widget: Widget_size }) {
    return <WidgetSizeX_LineUI sizeHelper={p.widget.sizeHelper} bounds={p.widget.config} />
})

export const WidgetSizeX_LineUI = observer(function WidgetSize_LineUI_(p: {
    sizeHelper: ResolutionState
    bounds?: { min?: number; max?: number; step?: number }
}) {
    const uist = p.sizeHelper

    return (
        <div className='flex flex-1 flex-col gap-1'>
            <div tw='flex items-center gap-1'>
                <div tw='virtualBorder' style={{ width: '2rem', height: '2rem' }}>
                    <div
                        tw='bg-primary'
                        style={{
                            //
                            width: uist.height < uist.width ? '2rem' : `${(uist.width / uist.height) * 2}rem`,
                            height: uist.height < uist.width ? `${(uist.height / uist.width) * 2}rem` : '2rem',
                        }}
                    ></div>
                </div>
                <InputNumberUI
                    //
                    min={p.bounds?.min ?? 128}
                    max={p.bounds?.max ?? 4096}
                    step={p.bounds?.step ?? 32}
                    mode='int'
                    tw='join-item'
                    value={uist.width}
                    hideSlider
                    onValueChange={(next) => uist.setWidth(next)}
                    forceSnap={true}
                    text='Width'
                    suffix='px'
                />
                <InputNumberUI
                    //
                    tw='join-item'
                    min={p.bounds?.min ?? 128}
                    max={p.bounds?.max ?? 4096}
                    step={p.bounds?.step ?? 32}
                    hideSlider
                    mode='int'
                    value={uist.height}
                    onValueChange={(next) => uist.setHeight(next)}
                    forceSnap={true}
                    text='Height'
                    suffix='px'
                />
                <button // Aspect Lock button
                    tw={['btn btn-xs', uist.isAspectRatioLocked && 'bg-primary hover:bg-primary text-primary-content']}
                    onClick={(ev) => {
                        uist.isAspectRatioLocked = !uist.isAspectRatioLocked
                        if (!uist.isAspectRatioLocked) {
                            return
                        }
                        /* Need to snap value if linked */
                        if (uist.wasHeightAdjustedLast) {
                            uist.setHeight(uist.height)
                        } else {
                            uist.setWidth(uist.width)
                        }
                    }}
                >
                    <span className='material-symbols-outlined'>{uist.isAspectRatioLocked ? 'link' : 'link_off'}</span>
                </button>
            </div>
        </div>
    )
})
export const WigetSizeXUI = observer(function WigetSizeXUI_(p: {
    // size: SizeAble
    sizeHelper: ResolutionState
    bounds?: { min?: number; max?: number; step?: number }
}) {
    const uist = p.sizeHelper
    if (!uist.isAspectRatioLocked) return null
    const resoBtn = (ar: AspectRatio) => (
        <button
            type='button'
            tw={['btn btn-xs join-item', uist.desiredAspectRatio === ar && 'btn-primary']}
            onClick={() => uist.setAspectRatio(ar)}
        >
            {ar}
        </button>
    )

    const modelBtn = (model: ModelType) => (
        <button
            type='button'
            tw={['btn btn-xs join-item', uist.desiredModelType === model && 'btn-primary']}
            onClick={() => uist.setModelType(model)}
        >
            {model}
        </button>
    )

    return (
        <div className='flex flex-col gap-1 bg-base-300 p-1 rounded-b'>
            <div tw='flex items-start gap-2'>
                <Joined>
                    {modelBtn('1.5')}
                    {modelBtn('xl')}
                </Joined>
                {/* <div tw='flex items-center'>
                        filp:
                        <Toggle
                            //
                            checked={uist.flip}
                            onChange={(ev) => (uist.flip = ev.target.checked)}
                        />
                    </div> */}
                <div tw='ml-auto flex items-center'>
                    <Joined>{resoBtn('1:1')}</Joined>
                    <div>|</div>
                    <Joined>
                        {resoBtn('16:9')}
                        {resoBtn('9:16')}
                    </Joined>
                    <div>|</div>
                    <Joined>
                        {resoBtn('4:3')}
                        {resoBtn('3:4')}
                    </Joined>
                    <div>|</div>
                    <Joined>
                        {resoBtn('3:2')}
                        {resoBtn('2:3')}
                    </Joined>
                </div>
            </div>
        </div>
    )
})
