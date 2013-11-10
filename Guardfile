guard 'shell' do
	watch(%r{^request\.js}) { |m|
		n m[0], "Changed"
		`ant build`
	}
end
