<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #999; padding: 4px 8px; text-align: left; }
        th { background-color: #eee; }
        td.number { text-align: right; }
    </style>
</head>
<body>
    <h2>Balance générale</h2>
    <table>
        <thead>
            <tr>
                <th>Code</th>
                <th>Compte</th>
                <th>Type</th>
                <th>Débit</th>
                <th>Crédit</th>
                <th>Solde</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
                <tr>
                    <td>{{ $row['code'] }}</td>
                    <td>{{ $row['name'] }}</td>
                    <td>{{ $row['type'] }}</td>
                    <td class="number">{{ number_format($row['total_debit'], 2) }}</td>
                    <td class="number">{{ number_format($row['total_credit'], 2) }}</td>
                    <td class="number">{{ number_format($row['balance'], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
