/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { useAppStore } from './lib/store';

export default function App() {
  const { setLogs, setWeightLogs } = useAppStore();

  useEffect(() => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLogs(data);
        }
      })
      .catch(err => console.error("Failed to fetch logs:", err));
      
    fetch('/api/weight')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setWeightLogs(data);
        }
      })
      .catch(err => console.error("Failed to fetch weight logs:", err));
  }, [setLogs, setWeightLogs]);

  return <Layout />;
}

