import React from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

export const Card = ({ className, children, animated = false, delay = 0, ...props }) => {
  const Component = animated ? motion.div : 'div';
  const animationProps = animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: delay }
  } : {};

  return (
    <Component 
      className={cn("glass-card p-6", className)} 
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-xl font-semibold leading-none tracking-tight text-white", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn("text-sm text-slate-400 mt-1", className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("text-slate-200", className)} {...props}>
    {children}
  </div>
);
