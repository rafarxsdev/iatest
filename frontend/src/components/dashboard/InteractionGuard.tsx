import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { InteractionStatus } from '@types/interaction';
import { postInteractionHandled } from '@lib/post-interaction-client';
import styles from './InteractionGuard.module.css';

export interface InteractionGuardProps {
  cardId: string;
  initialStatus: InteractionStatus;
  children: ReactNode;
}

function progressTone(status: InteractionStatus): 'blocked' | 'ok' | 'warn' {
  if (status.isBlocked) {
    return 'blocked';
  }
  const { limit, remaining } = status;
  if (limit <= 0) {
    return 'warn';
  }
  if (remaining > limit * 0.3) {
    return 'ok';
  }
  return 'warn';
}

function fillWidthPercent(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (used / limit) * 100));
}

export default function InteractionGuard({ cardId, initialStatus, children }: InteractionGuardProps) {
  const [status, setStatus] = useState<InteractionStatus>(initialStatus);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const tone = progressTone(status);
  const fillClass =
    tone === 'blocked'
      ? styles.fillToneBlocked
      : tone === 'ok'
        ? styles.fillToneOk
        : styles.fillToneWarn;

  const onContainerClick = useCallback(async () => {
    if (status.isBlocked || processingRef.current) {
      return;
    }
    processingRef.current = true;
    setIsProcessing(true);
    try {
      const result = await postInteractionHandled(cardId);
      if (result.type === 'success') {
        setStatus(result.data);
      } else if (result.type === 'blocked') {
        setStatus(result.data);
      } else {
        console.warn('[InteractionGuard]', result.message, `(HTTP ${result.httpStatus})`);
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [cardId, status.isBlocked]);

  return (
    <div className={styles.root}>
      <div className={styles.statsColumn}>
        <div className={styles.metrics}>
          <span className={styles.label}>
            {status.used} de {status.limit} usos utilizados
          </span>
          {isProcessing ? <span className={styles.spinner} aria-hidden /> : null}
        </div>
        <div className={styles.track} aria-hidden>
          <div
            className={`${styles.fill} ${fillClass}`}
            style={{ width: `${fillWidthPercent(status.used, status.limit)}%` }}
          />
        </div>
      </div>
      <div className={styles.widgetColumn}>
        <div
          className={`${styles.shell} ${isProcessing ? styles.shellProcessing : ''}`}
          onClickCapture={onContainerClick}
          aria-busy={isProcessing}
        >
          <div className={`${styles.inner} ${status.isBlocked ? styles.innerBlocked : ''}`}>{children}</div>
          {status.isBlocked ? (
            <div className={styles.overlay} role="presentation">
              <p className={styles.overlayText}>Has alcanzado el límite de usos para este contenido</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
