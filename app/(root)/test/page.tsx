"use client"

import { useToast } from '@/app/lib/hooks/useToast';
import React, { useEffect } from 'react'


const page = () => {
    const toast = useToast()
  
  
    useEffect(() => {
      toast({ infinite: true, title: "Success!", mode: "positive", subtitle: "Your action was successful", open: true });
      toast({ infinite: true, title: "Error!", mode: "negative", subtitle: "Something went wrong", open: true });
      toast({ infinite: true, title: "Info", mode: "info", subtitle: "Here’s some information", open: true });
      toast({
				title: "",
				mode: "info",
				subtitle: "This stays until closed",
				infinite: true,
				open: true,
      });
      toast({
				title: "",
				mode: "info",
				subtitle: "This stays until closed",
				infinite: true,
				open: true,
			});
	
    }, []);
  

  return (
    <div>page</div>
  )
}

export default page