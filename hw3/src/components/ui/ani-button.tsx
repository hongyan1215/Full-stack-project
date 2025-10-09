import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { forwardRef } from "react";

type Props = React.ComponentProps<typeof Button>;

export const AniButton = forwardRef<HTMLButtonElement, Props>(function AniButton(
  { children, className, ...rest },
  ref
) {
  return (
    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}>
      <Button ref={ref} className={className} {...rest}>
        {children}
      </Button>
    </motion.div>
  );
});


