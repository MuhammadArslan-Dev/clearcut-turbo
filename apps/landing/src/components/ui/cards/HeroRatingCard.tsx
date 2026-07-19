import Text from "@clearcut/ui/text";
import React from 'react'

export default function HeroRatingCard() {
  return (
    <div className='max-w-[270px]  border border-gray-200  rounded-lg'>
        <div className='flex items-center gap-3 min-h-[40px] px-2 py-1'>
            <div className='w-5 h-5 rounded-full bg-yellow-500'></div>
            <Text as='h6' variant="heading-medium" weight='semibold' className='flex items-center'>
                4.5 <span className='heading-medium !font-semibold text-yellow-500'>+</span>
            </Text>
            <Text as='p' variant="body-xsmall">
                हमारे विद्यार्थियों द्वारा औसत रेटिंग
            </Text>
        </div>
    </div>
  )
}
